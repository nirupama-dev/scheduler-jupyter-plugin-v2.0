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


from typing import Dict, List, Optional

from pydantic import BaseModel


class ComposerEnvironment(BaseModel):
    """Defines a runtime context where job
    execution will happen. For example, conda
    environment.
    """

    name: str
    label: str
    description: str
    state: str
    file_extensions: List[str]  # Supported input file types
    metadata: Optional[Dict[str, str]]  # Optional metadata
    pypi_packages: Optional[Dict[str, str]] = None

    def __str__(self):
        return self.json()


class DescribeJob(BaseModel):
    input_filename: str
    composer_environment_name: str
    output_formats: Optional[List[str]] = None
    parameters: Optional[List[str]] = None
    serverless_name: object = None
    cluster_name: str
    mode_selected: str
    schedule_value: str
    retry_count: int = 2
    retry_delay: int = 5
    email_failure: bool = False
    email_delay: bool = False
    email: Optional[List[str]] = None
    name: str
    dag_id: str
    stop_cluster: bool = False
    time_zone: str
    local_kernel: bool = False
    email_success: bool = False
    packages_to_install: Optional[List[str]] = None

    @classmethod
    def from_dict(cls, data):
        return cls(**data)


class DescribeBucketName(BaseModel):
    bucket_name: str

    @classmethod
    def from_dict(cls, data):
        return cls(**data)


class DescribeUpdateVertexJob(BaseModel):
    input_filename: str
    display_name: str
    machine_type: Optional[str] = None
    accelerator_type: Optional[str] = None
    accelerator_count: Optional[int] = None
    kernel_name: Optional[str] = None
    schedule_value: str
    time_zone: str
    max_run_count: str
    region: Optional[str] = None
    cloud_storage_bucket: Optional[str] = None
    parameters: Optional[List[str]] = None
    service_account: Optional[str] = None
    network: Optional[str] = None
    subnetwork: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    gcs_notebook_source: str
    disk_type: Optional[str] = None
    disk_size: Optional[str] = None

    @classmethod
    def from_dict(cls, data):
        return cls(**data)
