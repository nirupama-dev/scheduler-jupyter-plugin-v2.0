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

from scheduler_jupyter_plugin.tests import mocks


class MockClientSession:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *args, **kwargs):
        return

    def get(self, api_endpoint, headers=None):
        return mocks.MockResponse(
            {
                "environments": [
                    {
                        "name": "projects/mock-project/locations/mock-location/environments/env1",
                        "state": "RUNNING",
                    },
                    {
                        "name": "projects/mock-project/locations/mock-location/environments/env2",
                        "state": "UPDATING",
                    },
                ]
            }
        )


async def test_list_composer(monkeypatch, jp_fetch):
    mocks.patch_mocks(monkeypatch)
    monkeypatch.setattr(aiohttp, "ClientSession", MockClientSession)
    mock_project_id = "mock-project-id"
    mock_region_id = "mock-region-id"

    response = await jp_fetch(
        "scheduler-plugin",
        "composerList",
        params={"project_id": mock_project_id, "region_id": mock_region_id},
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert len(payload) == 2
    assert payload[0]["name"] == "env1"
    assert payload[1]["name"] == "env2"
