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

import tornado
from jupyter_server.base.handlers import APIHandler

from scheduler_jupyter_plugin import credentials
from scheduler_jupyter_plugin.services import serviceUsage


class ServiceUsageController(APIHandler):
    @tornado.web.authenticated
    async def get(self):
        """Checks if a specific API is enabled for a Google Cloud project."""
        try:
            project_id = self.get_argument("project_id")
            api_service_name = self.get_argument("api_service_name")
            service_usage_client = serviceUsage.Client(
                await credentials.get_cached(), self.log
            )
            result = await service_usage_client.check_api_enabled(
                project_id, api_service_name
            )
            self.finish(json.dumps(result))
        except RuntimeError as e:
            error_data = e.args[0]
            status_code = error_data.get("status", 500)

            self.log.exception(f"Error checking api service state: {str(e)}")
            self.set_status(status_code)
            self.finish(json.dumps(error_data))
        except Exception as e:
            self.log.exception(f"Error checking api service state: {str(e)}")
            self.finish({"error": str(e)})
