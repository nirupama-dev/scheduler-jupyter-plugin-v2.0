/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { test, expect, galata } from '@jupyterlab/galata';

// Set a common timeout for all tests
const timeout = 5 * 60 * 1000;

// Generate formatted current date string
const now = new Date();
const pad = (num: number) => String(num).padStart(2, '0');
const dateTimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(Math.floor(now.getMinutes() / 5) * 5)}-${pad(now.getSeconds())}`;

/**
 * Helper function to navigate to Scheduled Jobs listing page.
 * @param {Object} page - Playwright page object.
 */
async function navigateToScheduleJobsListingPage(page: any) {
  await page
    .locator(
      '//*[@data-category="Google Cloud Resources" and @title="Scheduled Jobs"]'
    )
    .click();
  await page.getByLabel('Composer').click();
  await page
    .getByText('Loading Notebook Schedulers')
    .waitFor({ state: 'detached' });
  await page.waitForTimeout(10000);
}

/**
 * Helper function to check if an input field is not empty.
 * @param {Object} page - Playwright page object.
 * @param {string} label - Label of the input field.
 */
async function checkInputNotEmpty(page: any, label: any) {
  const input = page.getByLabel(label);
  const value = await input.inputValue();
  return value.trim() !== '';
}

async function checkInputFieldsNotEmpty(page: any) {
  // Validate that all input fields are not empty
  const jobNameNotEmpty = await checkInputNotEmpty(page, 'Job name*');
  const InputfileNotEmpty = await checkInputNotEmpty(page, 'Input file*');
  const ProjectIdNotEmpty = await checkInputNotEmpty(page, 'Project ID*');
  const RegionNotEmpty = await checkInputNotEmpty(page, 'Region*');
  const EnvironmentNotEmpty = await checkInputNotEmpty(page, 'Environment*');
  const RetrycountNotEmpty = await checkInputNotEmpty(page, 'Retry count');
  const RetrydelayNotEmpty = await checkInputNotEmpty(
    page,
    'Retry delay (minutes)'
  );

  const allFieldsFilled =
    jobNameNotEmpty &&
    InputfileNotEmpty &&
    ProjectIdNotEmpty &&
    RegionNotEmpty &&
    EnvironmentNotEmpty &&
    RetrycountNotEmpty &&
    RetrydelayNotEmpty;

  return allFieldsFilled;
}

/**
 * Helper function to create a job scheduler.
 * @param {Object} page - Playwright page object.
 * @param {string} scheduleType - Type of the job scheduler
 */
async function createJobScheduler(
  page: any,
  scheduleType: 'Run now' | 'Run on a schedule'
) {
  const filebrowser = page.locator("//li[@title='Google Cloud Storage']");
  if ((await filebrowser.count) > 0) {
    await page.getByTitle('File Browser (Ctrl+Shift+F)').click();
    await page.locator("(//div[@class='jp-DirListing-header'])[2]").click();
    await page
      .locator(
        "(//div[contains(@class,'jp-DirListing-headerItem jp-id-name')])[2]"
      )
      .click();
  }
  // await page.getByRole('region', { name: 'notebook content' }).click();
  // const locator = page.locator('.jp-LauncherCard:visible', {
  //   hasText: 'Python 3 (ipykernel)'
  // });
  const locator = page.locator(
    '(//*[@data-category="Notebook" and @title="Python 3 (ipykernel)"])[1]',
    {
      hasText: 'Python 3 (ipykernel)'
    }
  );
  if ((await locator.count()) > 0) {
    await locator.first().click();
    await page
      .getByLabel('Untitled.ipynb')
      .getByTitle('Job Scheduler')
      .getByRole('button')
      .click();
    await page.getByLabel('Composer').click();
    await page.getByLabel('Job name*').clear();
    await page.getByLabel('Job name*').fill(`test-` + dateTimeStr);
    // select environment
    await page.getByLabel('Environment*').click();
    await page.getByRole('option').first().click();

    if (scheduleType === 'Run now') {
      await page.getByLabel('Run now').click();
    }

    if (scheduleType === 'Run on a schedule') {
      await page.getByLabel('Run on a schedule').click();
    }

    if (!(await checkInputFieldsNotEmpty(page))) {
      await expect(page.getByLabel('Create Schedule')).toBeDisabled();
    } else {
      await expect(page.getByLabel('Create Schedule')).not.toBeDisabled();
      await page.pause();
      await page.getByLabel('Create Schedule').click();
      await page.pause();
      await page.getByRole('alert').waitFor({ state: 'attached' });
      await expect(
        page.locator(
          '(//div[@role="alert"and @class="Toastify__toast-body"])[1]'
        )
      ).toContainText('Job scheduler successfully created');
    }
  }
}

/**
 * Helper function to validate field error visibility and resolution.
 * @param {Object} page - Playwright page object.
 * @param {string} fieldLabel - Label of the field to validate.
 * @param {string} errorMessage - Error message to check visibility.
 * @param {boolean} isDropdown - Whether the field is a dropdown (default: false).
 * @param {string} [dropdownOption] - Option to select if field is a dropdown.
 */
async function validateErrorResolution(
  page: any,
  fieldLabel: any,
  errorMessage: any,
  isDropdown = false,
  dropdownOption = ''
) {
  // Clear the field
  await page.getByLabel(fieldLabel).clear();

  // Ensure the error message is visible
  await expect(page.getByText(errorMessage)).toBeVisible();

  // Interact with the field based on its type
  const field = page.getByLabel(fieldLabel);
  if (isDropdown) {
    await field.click();
    if (dropdownOption) {
      await page.getByRole('option', { name: dropdownOption }).click();
    } else {
      await page.getByRole('option').first().click();
    }
  } else {
    await field.click();
    await field.fill('test-' + dateTimeStr); // Fill with a placeholder value
  }

  // Verify the error message is no longer visible
  await expect(page.getByText(errorMessage)).toBeHidden();
}

test.describe('Composer scheduling jobs', () => {
  test('CMP-59:Can create a job scheduler with Run now', async ({ page }) => {
    test.setTimeout(timeout);
    await createJobScheduler(page, 'Run now');
  });

  test('CMP-59:Can create a job scheduler with Run on a schedule', async ({
    page
  }) => {
    test.setTimeout(timeout);
    await createJobScheduler(page, 'Run on a schedule');
  });

  test('CMP-31:Cancel job creation', async ({ page }) => {
    test.setTimeout(150 * 1000);

    const filebrowser = await page
      .locator("//li[@title='Google Cloud Storage']")
      .count();
    if (filebrowser > 0) {
      await page.getByTitle('File Browser (Ctrl+Shift+F)').click();
      await page.locator("(//div[@class='jp-DirListing-header'])[2]").click();
      await page
        .locator(
          "(//div[contains(@class,'jp-DirListing-headerItem jp-id-name')])[2]"
        )
        .click();
    }

    // Navigate to the notebook content region
    // await page.getByRole('region', { name: 'notebook content' }).click();

    // Locate and select the Python 3 kernel card
    // const locator = page.locator('.jp-LauncherCard:visible', {
    //   hasText: 'Python 3 (ipykernel)'
    // });
    const locator = page.locator(
      '(//*[@data-category="Notebook" and @title="Python 3 (ipykernel)"])[1]',
      {
        hasText: 'Python 3 (ipykernel)'
      }
    );

    const count = await locator.count();
    expect(count).toBeGreaterThan(0);
    if (count > 0) {
      await locator.first().click();
      await page
        .getByLabel('Untitled.ipynb')
        .getByTitle('Job Scheduler')
        .getByRole('button')
        .click();
      await page.getByLabel('Composer').click();
      await page.getByLabel('Job name*').fill(`test-` + dateTimeStr);

      // Select the first available option for dropdown fields
      const dropdownFields = ['Environment*'];

      for (const label of dropdownFields) {
        await page.getByLabel(label).click();
        await page.getByRole('option').first().click();
      }

      const inputfields = await checkInputFieldsNotEmpty(page);

      if (inputfields) {
        await expect(page.getByLabel('cancel Batch')).toBeEnabled();
        await page.getByLabel('cancel Batch').click();
        await expect(
          page.locator(
            '//div[@class="lm-TabBar-tabLabel" and contains(text(),".ipynb")]'
          )
        ).toBeVisible();
      }
    }
  });

  test('CMP-01,CMP-03,CMP-04,CMP-05,CMP-06,CMP-07,CMP-08,CMP-09,CMP-10,CMP-11,CMP-12,CMP-13,CMP-22,CMP-23,CMP-24,CMP-25,CMP-26,CMP-27.CMP-28,CMP-29,CMP-30:Sanity: can perform field validation', async ({
    page
  }) => {
    test.setTimeout(150 * 1000);

    const filebrowser = await page
      .locator("//li[@title='Google Cloud Storage']")
      .count();
    if (filebrowser > 0) {
      await page.getByTitle('File Browser (Ctrl+Shift+F)').click();
      await page.locator("(//div[@class='jp-DirListing-header'])[2]").click();
      await page
        .locator(
          "(//div[contains(@class,'jp-DirListing-headerItem jp-id-name')])[2]"
        )
        .click();
    }

    // Navigate to the notebook content
    // await page.getByRole('region', { name: 'notebook content' }).click();

    // Locate and select the Python 3 kernel card
    // const kernelCard = page.locator('.jp-LauncherCard:visible', {
    //   hasText: 'Python 3 (ipykernel)'
    // });
    const kernelCard = page.locator(
      '(//*[@data-category="Notebook" and @title="Python 3 (ipykernel)"])[1]',
      {
        hasText: 'Python 3 (ipykernel)'
      }
    );
    const kernelCount = await kernelCard.count();
    expect(kernelCount).toBeGreaterThan(0);

    if (kernelCount > 0) {
      await kernelCard.first().click();

      // Step 3: Open Job Scheduler dialog
      await page
        .getByLabel('Untitled.ipynb')
        .getByTitle('Job Scheduler')
        .getByRole('button')
        .click();

      await page.getByLabel('Composer').click();

      // Validate fields and behavior
      await expect(page.getByLabel('Vertex')).toBeVisible();
      await expect(page.getByLabel('Vertex')).not.toBeChecked();
      await expect(page.getByLabel('Composer')).toBeVisible();
      // await expect(page.getByLabel('Composer')).toBeChecked();
      await expect(
        page.getByRole('radiogroup').first().getByTestId('composer-selected')
      ).toBeTruthy();

      // Check input file text box explanation
      await page
        .getByText(
          'This schedule will run a copy of this notebook in its current state. If you edit the original notebook, you must create a new schedule to run the updated version of the notebook.'
        )
        .isVisible();

      // Validate all errors and resolve them
      const fieldsToValidate = [
        {
          label: 'Job name*',
          error: 'Job name is required',
          isDropdown: false
        },
        {
          label: 'Region*',
          error: 'Region is required',
          isDropdown: true,
          dropdownOption: 'us-central1'
        },
        {
          label: 'Environment*',
          error: 'Environment is required field',
          isDropdown: true
        }
      ];

      for (const field of fieldsToValidate) {
        await validateErrorResolution(
          page,
          field.label,
          field.error,
          field.isDropdown,
          field.dropdownOption
        );
      }

      // Check input file field is  disabled
      await expect(page.locator('(//input[@disabled])[1]')).toBeDisabled();

      // verify notebook checkbox is selected in output format
      await page.getByText('Notebook', { exact: true }).isVisible();

      // Add a parameter and validate
      await page.getByRole('button', { name: 'ADD PARAMETER' }).click();
      await expect(page.getByText('Key is required')).toBeVisible();
      await expect(page.getByText('Value is required')).toBeVisible();
      await expect(
        page.locator('//button[@class="job-add-property-button-disabled"]')
      ).toBeVisible();
      await expect(page.getByLabel('Create Schedule')).toBeDisabled();
      await page.getByLabel('Key 1*').fill('key1');
      await expect(page.getByText('key is required')).toBeHidden();
      await page.getByLabel('Value 1').click();
      await page.getByLabel('Value 1').fill('value1');
      await expect(page.getByText('Value is required')).toBeHidden();
      await expect(
        page.getByRole('button', { name: 'ADD PARAMETER' })
      ).toBeEnabled();

      // Add second parameter and delete it
      await page.getByRole('button', { name: 'ADD PARAMETER' }).click();
      await expect(page.getByText('Key is required')).toBeVisible();
      await expect(page.getByText('Value is required')).toBeVisible();
      await expect(
        page.locator('//button[@class="job-add-property-button-disabled"]')
      ).toBeVisible();
      await expect(page.getByLabel('Create Schedule')).toBeDisabled();
      await page.getByLabel('Key 2*').fill('key2');
      await expect(page.getByText('key is required')).toBeHidden();
      await page.getByLabel('Value 2').click();
      await page.getByLabel('Value 2').fill('value2');
      await expect(page.getByText('Value is required')).toBeHidden();
      await page.locator('(//div[@class="labels-delete-icon"])[2]').click();
      await page.getByLabel('Key 2*').isHidden();
      await page.getByLabel('Value 2').isHidden();
      //await expect(page.locator('(//div[@class="job-label-edit-row"])[2]')).toBeHidden();
      await expect(
        page.getByRole('button', { name: 'ADD PARAMETER' })
      ).toBeEnabled();

      // Email Recipient
      await expect(page.getByLabel('Email on failure')).not.toBeChecked();
      await expect(page.getByLabel('Email on retry')).not.toBeChecked();
      await expect(page.getByLabel('Email on success')).not.toBeChecked();
      await page.getByLabel('Email on failure').click();
      await page.getByLabel('Email on retry').click();
      await page.getByLabel('Email on success').click();
      await expect(page.getByLabel('Email recipients')).toBeVisible();
      await expect(
        page.getByText('Email recipients is required field')
      ).toBeVisible();
      await expect(page.getByLabel('Create Schedule')).toBeDisabled();
      await page.getByLabel('Email recipients').fill('testabc@google.com');
      await page.getByLabel('Email recipients').press('Enter');
      await expect(
        page.getByText('Email recipients is required field')
      ).toBeHidden();

      // Schedule configuration
      await page.getByLabel('Run on a schedule').click();
      await expect(
        page.getByRole('radiogroup').getByTestId('runSchedule-selected')
      ).toBeTruthy();
      await expect(page.getByTitle('week')).toBeVisible();
      await expect(
        page.locator('//div[@data-testid="custom-select-week-days"]')
      ).toBeVisible();
      await expect(
        page.locator('//div[@data-testid="custom-select-hours"]')
      ).toBeVisible();
      await expect(
        page.locator('//div[@data-testid="custom-select-minutes"]')
      ).toBeVisible();
      await expect(
        page.locator('//div[@class="react-js-cron"]//button')
      ).toBeVisible();
      await expect(page.getByLabel('Time Zone')).not.toBeEmpty();
    }
  });
});

// Function to get the first job that has a specific action enabled
async function getJobWithAction(page: any, action: any) {
  // Check list of jobs are displayed
  const tableLocator = page.locator('//table[@class="clusters-list-table"]');
  if (await tableLocator.isVisible()) {
    const jobRows = page.locator('//tr[@class="cluster-list-data-parent"]');
    const noOfJobs = await jobRows.count();

    for (let i = 0; i < noOfJobs; i++) {
      const actionIcon = jobRows.nth(i).locator(`//div[@title="${action}"]`);
      if ((await actionIcon.isVisible()) && (await actionIcon.isEnabled())) {
        return jobRows.nth(i);
      }
    }
    return null;
  } else {
    await expect(page.getByText('No rows to display')).toBeVisible();
    return null;
  }
}

test.describe('Composer scheduling jobs listing page validation', () => {
  test('CMP-32,CMP-38,CMP-39,CMP-40,CMP-47,CMP-48:Sanity: Can verify fields on the page', async ({
    page
  }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    // Validate fields and behavior
    await expect(page.getByLabel('Vertex')).toBeVisible();
    await expect(page.getByLabel('Vertex')).not.toBeChecked();
    await expect(page.getByLabel('Composer')).toBeVisible();
    await expect(page.getByLabel('Composer')).toBeChecked();
    const environmentField = page.getByLabel('Environment*');
    await expect(environmentField).toBeVisible();
    await environmentField.click();
    await page.getByRole('option').first().click();
    await expect(page.getByLabel('Project ID*')).toBeVisible();
    // await page.getByLabel('Project ID*').click();
    // await page.getByRole('option').first().click();
    await expect(page.getByLabel('Project ID*')).toBeDisabled();
    await expect(page.getByLabel('Region*')).toBeVisible();
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    await page.waitForTimeout(10000);
    // Check list of jobs are displayed
    const tableExists = await page
      .locator('//table[@class="clusters-list-table"]')
      .isVisible();
    if (tableExists) {
      const headers = ['Job Name', 'Schedule', 'Status', 'Actions'];
      for (const header of headers) {
        await expect(
          page.getByRole('columnheader', { name: header, exact: true })
        ).toBeVisible();
      }
      const rowCount = await page
        .locator('//table[@class="clusters-list-table"]//tr')
        .count();
      expect(rowCount).toBeGreaterThan(0);
    } else {
      await expect(page.getByText('No rows to display')).toBeVisible();
    }
  });

  test('Check if job is active or completed or paused', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    await page.waitForTimeout(20000);
    // Check the job status
    const tableExists = await page
      .locator('//table[@class="clusters-list-table"]')
      .isVisible();
    if (tableExists) {
      const parentLocator = page.locator(
        '//tr[@class="cluster-list-data-parent"]'
      );
      const noOfRows = await parentLocator.count();
      for (let i = 0; i < noOfRows; i++) {
        const status = await parentLocator
          .nth(i)
          .locator('//td[@role="cell"][3]')
          .innerText();

        //check status column text
        expect(['Active', 'Completed', 'Paused']).toContainEqual(status);
        break;
      }
    } else {
      await expect(page.getByText('No rows to display')).toBeVisible();
    }
  });

  test('Check if the job is created to run once or on a schedule', async ({
    page
  }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    await page.waitForTimeout(20000);
    const parentLocator = page.locator(
      '//tr[@class="cluster-list-data-parent"]'
    );
    const noOfClusters = await parentLocator.count();
    for (let i = 0; i < noOfClusters; i++) {
      const schedulecol = await parentLocator
        .nth(i)
        .locator('//td[@role="cell"][2]')
        .innerText();
      //check schedule column text
      await ScheduleText(schedulecol);
      break;
    }
    //check schedule column text
    async function ScheduleText(schedulecol: any) {
      if (schedulecol == 'Once, as soon as possible') {
        console.log('job is created for run once');
      } else {
        console.log('job is created for a schedule: ' + schedulecol);
      }
    }
  });

  test('CMP-41,CMP-45,CMP-46:Pause a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    await page.waitForTimeout(20000);
    const jobLocator = await getJobWithAction(page, 'Pause');
    if (jobLocator) {
      const jobName = await jobLocator
        .locator('//td[@role="cell"][1]')
        .innerText();
      console.log(`Pausing job: ${jobName}`);
      const msg = 'scheduler ' + jobName + ' updated successfully';

      await jobLocator.locator('//div[@title="Pause"]').click();
      await jobLocator.getByText('Active').waitFor({ state: 'detached' });
      await expect(jobLocator.getByText('Paused')).toBeVisible();
      // Toast messages are not getting displayed while running automation test cases, hence commenting toast message verification code
      await expect(
        page.locator(
          '(//div[@role="alert"and @class="Toastify__toast-body"])[1]'
        )
      ).toContainText(msg);
    } else {
      console.log('No job available to pause.');
    }
  });

  // Test to handle the "Resume" action
  test('CMP-42,CMP-45,CMP-46:Resume a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    await page.waitForTimeout(20000);
    const jobLocator = await getJobWithAction(page, 'Unpause');
    if (jobLocator) {
      const jobName = await jobLocator
        .locator('//td[@role="cell"][1]')
        .innerText();
      console.log(`Resuming job: ${jobName}`);
      const msg = 'scheduler ' + jobName + ' updated successfully';

      await jobLocator.locator('//div[@title="Unpause"]').click();
      await jobLocator.getByText('Paused').waitFor({ state: 'detached' });
      await expect(jobLocator.getByText('Active')).toBeVisible();
      // Toast messages are not getting displayed while running automation test cases, hence commenting toast message verification code
      await expect(
        page.locator(
          '(//div[@role="alert"and @class="Toastify__toast-body"])[1]'
        )
      ).toContainText(msg);
    } else {
      console.log('No job available to resume.');
    }
  });

  // Test to handle the "Trigger" action
  test('CMP-46:Trigger a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    await page.waitForTimeout(20000);
    const jobLocator = await getJobWithAction(page, 'Trigger the job');
    if (jobLocator) {
      const jobName = await jobLocator
        .locator('//td[@role="cell"][1]')
        .innerText();
      const triggerMessage = `${jobName} triggered successfully`;
      console.log(`Triggering job: ${jobName}`);

      await jobLocator.locator('//div[@title="Trigger the job"]').click();
      // Toast messages are not getting displayed while running automation test cases, hence commenting toast message verification code
      await expect(
        page.locator(
          '(//div[@role="alert" and @class="Toastify__toast-body"])[1]'
        )
      ).toContainText(triggerMessage);
    } else {
      console.log('No job available to trigger.');
    }
  });

  // Test to handle "Edit Schedule" function
  test('CMP-46:Edit a schedule', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    await page.waitForTimeout(20000);
    const jobLocator = await getJobWithAction(page, 'Edit Schedule');

    if (jobLocator) {
      const jobName = await jobLocator
        .locator('//td[@role="cell"][1]')
        .innerText();
      const msg = 'Job scheduler successfully updated';

      await jobLocator.locator('//div[@title="Edit Schedule"]').click();

      // update retry count
      await page.getByLabel('Retry count').clear();
      await page.getByLabel('Retry count').fill('5');

      //validate disabled fields
      await expect(page.getByLabel('Job name*')).toBeDisabled();
      await expect(page.getByLabel('Input file*')).toBeDisabled();
      // Check input file text box explanation
      await page
        .getByText(
          'This schedule will run a copy of this notebook in its current state. If you edit the original notebook, you must create a new schedule to run the updated version of the notebook.'
        )
        .isVisible();
      await expect(page.getByLabel('Project ID*')).toBeDisabled();
      await expect(page.getByLabel('Region*')).toBeDisabled();
      await expect(page.getByLabel('Environment*')).toBeDisabled();
      // await expect(
      //   page.getByText('Checking if required packages are installed...')
      // ).toBeVisible();
      await expect(page.getByLabel('Vertex')).toBeDisabled();

      // Validate that input fields are not empty
      const inputfields = await checkInputFieldsNotEmpty(page);

      // click update
      if (!inputfields) {
        await expect(page.getByLabel(' Update Schedule')).toBeDisabled();
      } else {
        await page
          .getByText('Checking if required packages are installed...')
          .waitFor({ state: 'detached' });
        await expect(page.getByLabel(' Update Schedule')).not.toBeDisabled();
        await page.getByLabel(' Update Schedule').click();
        await page.getByText('UPDATING').waitFor({ state: 'detached' });
      }
      // verify schedule updated
      // Toast messages are not getting displayed while running automation test cases, hence commenting toast message verification code
      await expect(
        page.locator(
          '(//div[@role="alert"and @class="Toastify__toast-body"])[1]'
        )
      ).toContainText(msg);
    } else {
      console.log('No job available to update.');
    }
  });

  // Test to cancel "Edit Schedule"
  test('Cancel Edit schedule', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    await page.waitForTimeout(20000);
    const jobLocator = await getJobWithAction(page, 'Edit Schedule');

    if (jobLocator) {
      await jobLocator.locator('//div[@title="Edit Schedule"]').click();

      // update retry count
      await page.getByLabel('Retry count').clear();
      await page.getByLabel('Retry count').fill('5');

      //validate disabled fields
      await expect(page.getByLabel('Job name*')).toBeDisabled();
      await expect(page.getByLabel('Input file*')).toBeDisabled();
      await expect(page.getByLabel('Project ID*')).toBeDisabled();
      await expect(page.getByLabel('Region*')).toBeDisabled();
      await expect(page.getByLabel('Environment*')).toBeDisabled();
      // await expect(
      //   page.getByText('Checking if required packages are installed...')
      // ).toBeVisible();
      await expect(page.getByLabel('Vertex')).toBeDisabled();

      // Validate that input fields are not empty
      const inputfields = await checkInputFieldsNotEmpty(page);

      // click cancel
      if (inputfields) {
        await expect(page.getByLabel('cancel Batch')).not.toBeDisabled();
        await page.getByLabel('cancel Batch').click();
      }

      // verify schedule not updated
      await page
        .getByText('Loading Notebook Schedulers')
        .waitFor({ state: 'detached' });
      await expect(
        page.locator('//div[@class="cluster-details-title"]')
      ).toBeVisible();
      await page.locator('//table[@class="clusters-list-table"]').isVisible();
    } else {
      console.log('No job available to update.');
    }
  });

  // Test to handle the "Edit Notebook" action
  test('CMP-60:Can edit a notebook', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    const jobLocator = await getJobWithAction(page, 'Edit Notebook');

    if (jobLocator) {
      await expect(
        jobLocator.locator('//div[@title="Edit Notebook"]')
      ).toBeEnabled();
      await jobLocator.locator('//div[@title="Edit Notebook"]').click();
      await page.getByRole('progressbar').waitFor({ state: 'detached' });
      const kernelpopup = await page
        .locator('//div[@class="lm-Widget lm-Panel jp-Dialog-content"]')
        .isVisible();
      if (kernelpopup) {
        await page.getByLabel('Select Kernel').click();
      } else {
        console.log('no kernel popup');
      }
      await expect(
        page.locator(
          '//div[@class="lm-TabBar-tabLabel" and contains(text(),".ipynb")]'
        )
      ).toBeVisible();
    }
  });

  // Test to handle the "Delete" action
  test('CMP-43,CMP-44,CMP-46:Delete a job', async ({ page }) => {
    test.setTimeout(timeout);
    await navigateToScheduleJobsListingPage(page);
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    await page.waitForTimeout(20000);
    const jobLocator = await getJobWithAction(page, 'Delete');
    if (jobLocator) {
      const jobName = await jobLocator
        .locator('//td[@role="cell"][1]')
        .innerText();
      console.log(`Deleting job: ${jobName}`);

      await jobLocator.locator('//div[@title="Delete"]').click();
      await expect(
        page.getByText(`This will delete ${jobName} and cannot be undone.`)
      ).toBeVisible();
      await page.getByRole('button', { name: 'Delete' }).click();
      await page.waitForTimeout(5000);
      await expect(
        page.getByText(
          `Deleted job ${jobName}. It might take a few minutes to for it to be deleted from the list of jobs.`
        )
      ).toBeVisible();
    } else {
      console.log('No job available to delete.');
    }
  });
});

// Helper to navigate to the Execution History page for the first job
async function navigateToExecutionHistory(page: any) {
  const jobName = await page.getByRole('cell').first().innerText();
  await page.getByRole('cell').first().click();
  await page.getByText('Loading History').waitFor({ state: 'detached' });
  await page
    .getByText('Loading Dag Runs Task Instances')
    .waitFor({ state: 'detached' });
  return jobName;
}

test.describe('Composer scheduling jobs execution history', () => {
  test('CMP-33,CMP-34,CMP-49,CMP-50,CMP-51,CMP-52,CMP-53,CMP-54,CMP-55,CMP-56,CMP-57,CMP-58:Sanity: can verify execution history page', async ({
    page
  }) => {
    test.setTimeout(150 * 1000);

    await navigateToScheduleJobsListingPage(page);
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    await page.waitForTimeout(20000);
    const listingTableExists = await page
      .locator('//table[@class="clusters-list-table"]')
      .isVisible();
    if (listingTableExists) {
      const jobName = await navigateToExecutionHistory(page);

      // Verify job name is displayed
      await expect(
        page.getByText('Execution History: ' + jobName)
      ).toBeVisible();

      // Verify current date is selected
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, '0');
      const date = `${pad(now.getDate())}`;
      const selecteddate = await page
        .locator('//button[@aria-current]')
        .innerText();
      const length = selecteddate.length;
      if (length == 1) {
        const date2 = '0' + selecteddate;
        await expect(date2).toContain(date);
      } else {
        await expect(selecteddate).toContain(date);
      }

      // Verify future dates are disabled
      await expect(
        page.locator('(//button[@aria-current]/following::button)[1]')
      ).toBeDisabled();

      // Check table headers if table data is present
      const historyDataExists = await page
        .locator('//table[@class="clusters-list-table"]')
        .isVisible();
      if (historyDataExists) {
        const headers = ['State', 'Date', 'Time', 'Actions'];
        for (const header of headers) {
          await expect(
            page.getByRole('columnheader', { name: header, exact: true })
          ).toBeVisible();
        }

        const requiredFields = ['Task Id', 'Attempts', 'Duration (in seconds)'];

        for (const field of requiredFields) {
          await expect(
            page.locator(
              `//div[@class="accordion-row-data" and text()="${field}"]`
            )
          ).toBeVisible();
        }

        const rowCount = await page
          .locator('//div[@class="accordion-row-parent"]')
          .count();
        //expect(rowCount).toBeGreaterThanOrEqual(1);
        if (rowCount > 0) {
          console.log('logs are displayed');
        } else {
          await expect(page.getByText('No rows to display')).toBeVisible();
          console.log('no logs are displayed');
        }
      } else {
        await expect(page.getByText('No rows to display')).toBeVisible();
      }
    } else {
      await expect(page.getByText('No rows to display')).toBeVisible();
    }
  });

  test('CMP-35,CMP-36,CMP-37:Can download output from execution history page', async ({
    page
  }) => {
    test.setTimeout(150 * 1000);
    await navigateToScheduleJobsListingPage(page);
    await page
      .getByText('Loading Notebook Schedulers')
      .waitFor({ state: 'detached' });
    await page.waitForTimeout(20000);
    const listingTableExists = await page
      .locator('//table[@class="clusters-list-table"]')
      .isVisible();
    if (listingTableExists) {
      const jobName = await navigateToExecutionHistory(page);

      const historyDataExists = await page
        .locator('//table[@class="clusters-list-table"]')
        .isVisible();
      if (historyDataExists) {
        // Check the status and download the output
        const status = await page
          .locator('//tr[@class="cluster-list-data-parent"][1]/div/td')
          .first()
          .innerText();

        if (status === 'Success') {
          await page
            .getByRole('button', { name: 'Download Output' })
            .first()
            .click();
          await page.getByRole('progressbar').waitFor({ state: 'detached' });
          // Check the confirmation message
          // Toast messages are not getting displayed while running automation test cases, hence commenting toast message verification code
          await expect(
            page.locator(
              '(//div[@role="alert"and @class="Toastify__toast-body"])[1]'
            )
          ).toHaveText(jobName);
          await expect(
            page.locator(
              '(//div[@role="alert"and @class="Toastify__toast-body"])[1]'
            )
          ).toHaveText('downloaded successfully');
        } else {
          const downloadButtonClass = await page
            .getByRole('button', { name: 'Download Output' })
            .first()
            .getAttribute('class');

          // Verify the download button is disabled
          expect(downloadButtonClass).toContain('disable');

          // Ensure the status is failed or penging
          expect(['Failed', 'pending']).toContainEqual(status);
        }
      } else {
        await expect(page.getByText('No rows to display')).toBeVisible();
      }
    } else {
      await expect(page.getByText('No rows to display')).toBeVisible();
    }
  });
});
