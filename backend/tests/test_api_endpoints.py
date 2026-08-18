def test_health_check(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "Mabicons Attendance"
    assert data["company"] == "Mabicons Technosoft Pvt Ltd"

def test_login_super_admin(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "superadmin@mabicons.com",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "SUPER_ADMIN"

def test_unconfigured_device_connection_test(client):
    # Authenticate as super admin
    auth_resp = client.post("/api/v1/auth/login", json={
        "email": "superadmin@mabicons.com",
        "password": "Admin@123"
    })
    token = auth_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test MORX Factory Gate device (Device ID 2) which is unconfigured
    test_resp = client.post("/api/v1/devices/2/test-connection", headers=headers)
    assert test_resp.status_code == 200
    res_data = test_resp.json()
    assert res_data["success"] is False
    assert "Driver not configured for MORX device" in res_data["message"]
