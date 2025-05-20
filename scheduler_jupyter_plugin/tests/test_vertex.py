# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import aiohttp

import pytest

from scheduler_jupyter_plugin.services import vertex
from scheduler_jupyter_plugin.tests.mocks import (
    MockDeleteSchedulesClientSession,
    MockGetScheduleClientSession,
    MockListNotebookExecutionJobsClientSession,
    MockListUIConfigClientSession,
    MockPostClientSession,
)


@pytest.mark.parametrize(
    "returncode, expected_result", [(0, {"key1": "value1", "key2": "value2"})]
)
async def test_get_schedule(monkeypatch, returncode, expected_result, jp_fetch):
    monkeypatch.setattr(aiohttp, "ClientSession", MockGetScheduleClientSession)

    mock_region_id = "mock-region-id"
    mock_schedule_id = "mock-project-id"

    response = await jp_fetch(
        "scheduler-plugin",
        "api/vertex/getSchedule",
        params={"region_id": mock_region_id, "schedule_id": mock_schedule_id},
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == expected_result


@pytest.mark.parametrize("returncode, expected_result", [(0, {})])
async def test_resume_schedule(monkeypatch, returncode, expected_result, jp_fetch):
    monkeypatch.setattr(aiohttp, "ClientSession", MockPostClientSession)

    mock_region_id = "mock-region-id"
    mock_schedule_id = "mock-project-id"

    response = await jp_fetch(
        "scheduler-plugin",
        "api/vertex/resumeSchedule",
        method="POST",
        allow_nonstandard_methods=True,
        params={"region_id": mock_region_id, "schedule_id": mock_schedule_id},
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == expected_result


@pytest.mark.parametrize("returncode, expected_result", [(0, {})])
async def test_pause_schedule(monkeypatch, returncode, expected_result, jp_fetch):
    monkeypatch.setattr(aiohttp, "ClientSession", MockPostClientSession)

    mock_region_id = "mock-region-id"
    mock_schedule_id = "mock-project-id"

    response = await jp_fetch(
        "scheduler-plugin",
        "api/vertex/pauseSchedule",
        method="POST",
        allow_nonstandard_methods=True,
        params={"region_id": mock_region_id, "schedule_id": mock_schedule_id},
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == expected_result


@pytest.mark.parametrize(
    "returncode, expected_result", [(0, {"name": "mock-name", "done": True})]
)
async def test_delete_schedule(monkeypatch, returncode, expected_result, jp_fetch):
    monkeypatch.setattr(aiohttp, "ClientSession", MockDeleteSchedulesClientSession)

    mock_region_id = "mock-region-id"
    mock_schedule_id = "mock-project-id"

    response = await jp_fetch(
        "scheduler-plugin",
        "api/vertex/deleteSchedule",
        method="DELETE",
        params={"region_id": mock_region_id, "schedule_id": mock_schedule_id},
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == expected_result


@pytest.mark.parametrize(
    "returncode, expected_result",
    [
        (
            0,
            [
                {
                    "machineType": "value1 (2 CPUs, 206.16 GB RAM)",
                    "acceleratorConfigs": [],
                },
                {
                    "machineType": "value12 (1 CPUs, 1005.02 GB RAM)",
                    "acceleratorConfigs": [],
                },
            ],
        )
    ],
)
async def test_list_uiconfig(monkeypatch, returncode, expected_result, jp_fetch):
    monkeypatch.setattr(aiohttp, "ClientSession", MockListUIConfigClientSession)

    mock_region_id = "mock-region-id"

    response = await jp_fetch(
        "scheduler-plugin",
        "api/vertex/uiConfig",
        params={"region_id": mock_region_id},
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == expected_result


@pytest.mark.parametrize(
    "returncode, expected_result",
    [
        (
            0,
            [{"name": "mock-name"}, {"name": "mock-name1"}],
        )
    ],
)
async def list_notebook_execution_jobs(
    monkeypatch, returncode, expected_result, jp_fetch
):
    monkeypatch.setattr(
        aiohttp, "ClientSession", MockListNotebookExecutionJobsClientSession
    )

    mock_region_id = "mock-region-id"
    mock_schedule_id = "mock-project-id"
    mock_order_by = "mock-order-by"

    response = await jp_fetch(
        "scheduler-plugin",
        "api/vertex/listNotebookExecutionJobs",
        params={
            "region_id": mock_region_id,
            "schedule_id": mock_schedule_id,
            "order_by": mock_order_by,
        },
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == expected_result
