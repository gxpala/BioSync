#!/usr/bin/env python3
"""
Mabicons Biometric Connector - Windows Background Agent Service
Architecture:
  Biometric Devices (LAN) ---> Mabicons Local Agent (This Service) ---> HTTPS Outbound ---> Mabicons Cloud API
"""

import os
import sys
import json
import time
import sqlite3
import socket
import logging
import requests
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("connector.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

class MabiconsLocalConnector:
    def __init__(self, config_path: str = "config.json"):
        self.config_path = config_path if os.path.exists(config_path) else "config.example.json"
        self.config = self.load_config()
        self.server_url = self.config.get("server_url", "http://localhost:8000/api/v1")
        self.secret_token = None
        self.db_path = "connector_offline_buffer.db"
        self.init_offline_queue()

    def load_config(self) -> dict:
        try:
            with open(self.config_path, "r") as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Failed to load config file {self.config_path}: {e}")
            sys.exit(1)

    def init_offline_queue(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS offline_punches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                serial_number TEXT,
                device_user_id TEXT,
                punch_timestamp TEXT,
                punch_type TEXT,
                verification_type TEXT,
                source TEXT,
                raw_payload TEXT,
                status TEXT DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

    def register_with_cloud(self) -> bool:
        endpoint = f"{self.server_url}/connector/register"
        payload = {
            "client_code": self.config.get("client_code"),
            "branch_code": self.config.get("branch_code"),
            "connector_name": self.config.get("connector_name", "Windows Local Agent"),
            "machine_name": socket.gethostname(),
            "ip_address": socket.gethostbyname(socket.gethostname()),
            "version": "1.0.0"
        }
        try:
            logging.info(f"Connecting to Cloud API to register agent: {endpoint}")
            resp = requests.post(endpoint, json=payload, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                self.secret_token = data.get("secret_token")
                logging.info(f"Successfully registered agent! Secret Token: {self.secret_token[:15]}...")
                return True
            else:
                logging.error(f"Cloud Registration failed: HTTP {resp.status_code} - {resp.text}")
                return False
        except Exception as e:
            logging.error(f"Network error registering agent with Cloud API: {e}")
            return False

    def send_heartbeat(self):
        if not self.secret_token:
            return
        endpoint = f"{self.server_url}/connector/heartbeat"
        device_statuses = []
        for dev in self.config.get("devices", []):
            device_statuses.append({
                "serial_number": dev.get("serial_number"),
                "status": "Online"
            })
        payload = {
            "secret_token": self.secret_token,
            "device_statuses": device_statuses
        }
        try:
            resp = requests.post(endpoint, json=payload, timeout=5)
            if resp.status_code == 200:
                logging.info("Heartbeat sent successfully.")
        except Exception as e:
            logging.warning(f"Heartbeat failed: {e}")

    def buffer_punch(self, serial_number: str, user_id: str, punch_timestamp: str, punch_type: str = "CHECK_IN"):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO offline_punches (serial_number, device_user_id, punch_timestamp, punch_type, source)
            VALUES (?, ?, ?, ?, 'LOCAL_CONNECTOR')
        """, (serial_number, user_id, punch_timestamp, punch_type))
        conn.commit()
        conn.close()

    def sync_buffered_punches(self):
        if not self.secret_token:
            return

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, serial_number, device_user_id, punch_timestamp, punch_type, source FROM offline_punches WHERE status='PENDING' LIMIT 50")
        rows = cursor.fetchall()
        
        if not rows:
            conn.close()
            return

        punches_payload = []
        row_ids = []
        for r in rows:
            row_ids.append(r[0])
            punches_payload.append({
                "serial_number": r[1],
                "device_user_id": r[2],
                "punch_timestamp": r[3],
                "punch_type": r[4],
                "source": r[5]
            })

        endpoint = f"{self.server_url}/connector/punches"
        payload = {
            "secret_token": self.secret_token,
            "punches": punches_payload
        }
        try:
            resp = requests.post(endpoint, json=payload, timeout=10)
            if resp.status_code == 200:
                res_data = resp.json()
                logging.info(f"Synced {len(punches_payload)} punches to Cloud API. Response: {res_data}")
                cursor.execute(f"DELETE FROM offline_punches WHERE id IN ({','.join(map(str, row_ids))})")
                conn.commit()
            else:
                logging.error(f"Punch sync failed: HTTP {resp.status_code} - {resp.text}")
        except Exception as e:
            logging.error(f"Network error syncing punches: {e}")
        finally:
            conn.close()

    def run(self):
        logging.info("Starting Mabicons Biometric Local Connector Service...")
        while not self.secret_token:
            if not self.register_with_cloud():
                time.sleep(5)

        logging.info("Agent online and listening to local devices...")
        last_hb = 0
        hb_interval = self.config.get("heartbeat_interval_sec", 15)

        while True:
            now = time.time()
            if now - last_hb > hb_interval:
                self.send_heartbeat()
                last_hb = now

            self.sync_buffered_punches()
            time.sleep(2)

if __name__ == "__main__":
    connector = MabiconsLocalConnector()
    connector.run()
