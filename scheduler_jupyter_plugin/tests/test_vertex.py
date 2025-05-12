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

from scheduler_jupyter_plugin.tests.mocks import (
    MockGetScheduleClientSession,
    MockListSchedulesClientSession,
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


# @pytest.mark.parametrize(
#     "returncode, expected_result",
#     [
#         (
#             0,
#             [
#                 {"key1": "value1", "key2": "value2"},
#                 {"key1": "value12", "key2": "value22"},
#             ],
#         )
#     ],
# )
# async def test_list_schedules(monkeypatch, returncode, expected_result, jp_fetch):
#     monkeypatch.setattr(aiohttp, "ClientSession", MockListSchedulesClientSession)

#     mock_region_id = "mock-region-id"
#     mock_page_size = "mock-page-size"

#     response = await jp_fetch(
#         "scheduler-plugin",
#         "api/vertex/listSchedules",
#         params={"region_id": mock_region_id, "page_size": mock_page_size},
#     )
#     assert response.code == 200
#     payload = json.loads(response.body)
#     assert payload == expected_result
