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
from scheduler_jupyter_plugin.services import cloudKms


class KeyRingsController(APIHandler):
    @tornado.web.authenticated
    async def get(self):
        """Returns available list of key rings"""
        try:
            region_id = self.get_argument("region_id")
            project_id = self.get_argument("project_id")
            cloud_kms_client = cloudKms.Client(
                await credentials.get_cached(), self.log, None
            )
            key_rings = await cloud_kms_client.list_key_rings(project_id, region_id)
            self.finish(json.dumps(key_rings))
        except Exception as e:
            self.log.exception(f"Error fetching key rings: {str(e)}")
            self.finish({"error": str(e)})


class CryptoKeysController(APIHandler):
    @tornado.web.authenticated
    async def get(self):
        """Returns available list of crypto keys"""
        try:
            region_id = self.get_argument("region_id")
            project_id = self.get_argument("project_id")
            key_ring = self.get_argument("key_ring")
            cloud_kms_client = cloudKms.Client(
                await credentials.get_cached(), self.log, None
            )
            crypto_keys = await cloud_kms_client.list_crypto_keys(
                project_id, region_id, key_ring
            )
            self.finish(json.dumps(crypto_keys))
        except Exception as e:
            self.log.exception(f"Error fetching crypto keys: {str(e)}")
            self.finish({"error": str(e)})