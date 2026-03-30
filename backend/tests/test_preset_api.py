import unittest
import uuid
from datetime import UTC, datetime
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import create_app
from app.schemas.preset import PresetResponse, ProjectPresetResponse


def build_preset_response(preset_id: int = 1, name: str = "Frontend") -> PresetResponse:
    now = datetime.now(UTC)
    return PresetResponse(
        preset_id=preset_id,
        user_id="user-1",
        name=name,
        description="Reusable preset",
        icon="default",
        color="#0ea5e9",
        prompt_template=None,
        browser_enabled=True,
        memory_enabled=False,
        skill_ids=[1],
        mcp_server_ids=[2],
        plugin_ids=[3],
        subagent_configs=[],
        created_at=now,
        updated_at=now,
    )


def build_project_preset_response(
    project_id: uuid.UUID,
    preset_id: int = 1,
    *,
    is_default: bool = True,
) -> ProjectPresetResponse:
    now = datetime.now(UTC)
    return ProjectPresetResponse(
        project_preset_id=11,
        project_id=project_id,
        preset_id=preset_id,
        is_default=is_default,
        sort_order=0,
        preset=build_preset_response(preset_id=preset_id),
        created_at=now,
        updated_at=now,
    )


class PresetApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app()
        self.client = TestClient(self.app)
        self.headers = {"X-User-Id": "user-1"}

    @patch("app.api.v1.presets.service.list_presets")
    def test_list_presets_returns_response_envelope(self, list_presets) -> None:
        list_presets.return_value = [build_preset_response()]

        response = self.client.get("/api/v1/presets", headers=self.headers)

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["code"], 0)
        self.assertEqual(body["data"][0]["preset_id"], 1)
        self.assertEqual(body["data"][0]["name"], "Frontend")
        list_presets.assert_called_once()

    @patch("app.api.v1.presets.service.create_preset")
    def test_create_preset_returns_created_payload(self, create_preset) -> None:
        create_preset.return_value = build_preset_response(preset_id=7, name="Backend")

        response = self.client.post(
            "/api/v1/presets",
            headers=self.headers,
            json={
                "name": "Backend",
                "description": "Backend preset",
                "icon": "default",
                "browser_enabled": False,
                "memory_enabled": True,
                "skill_ids": [],
                "mcp_server_ids": [],
                "plugin_ids": [],
                "subagent_configs": [],
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["code"], 0)
        self.assertEqual(body["data"]["preset_id"], 7)
        self.assertEqual(body["data"]["name"], "Backend")
        create_preset.assert_called_once()

    @patch("app.api.v1.presets.service.delete_preset")
    def test_delete_preset_returns_deleted_id(self, delete_preset) -> None:
        response = self.client.delete("/api/v1/presets/9", headers=self.headers)

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["code"], 0)
        self.assertEqual(body["data"]["id"], 9)
        delete_preset.assert_called_once()


class ProjectPresetApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app()
        self.client = TestClient(self.app)
        self.headers = {"X-User-Id": "user-1"}
        self.project_id = uuid.uuid4()

    @patch("app.api.v1.project_presets.service.add_preset_to_project")
    def test_add_project_preset_returns_nested_preset_payload(
        self, add_preset_to_project
    ) -> None:
        add_preset_to_project.return_value = build_project_preset_response(
            self.project_id,
            preset_id=3,
            is_default=True,
        )

        response = self.client.post(
            f"/api/v1/projects/{self.project_id}/presets",
            headers=self.headers,
            json={"preset_id": 3},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["code"], 0)
        self.assertEqual(body["data"]["preset_id"], 3)
        self.assertTrue(body["data"]["is_default"])
        self.assertEqual(body["data"]["preset"]["name"], "Frontend")
        add_preset_to_project.assert_called_once()

    @patch("app.api.v1.project_presets.service.set_default_preset")
    def test_set_default_project_preset_returns_updated_payload(
        self, set_default_preset
    ) -> None:
        set_default_preset.return_value = build_project_preset_response(
            self.project_id,
            preset_id=5,
            is_default=True,
        )

        response = self.client.put(
            f"/api/v1/projects/{self.project_id}/presets/5/default",
            headers=self.headers,
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["code"], 0)
        self.assertEqual(body["data"]["preset_id"], 5)
        self.assertTrue(body["data"]["is_default"])
        set_default_preset.assert_called_once()


if __name__ == "__main__":
    unittest.main()
