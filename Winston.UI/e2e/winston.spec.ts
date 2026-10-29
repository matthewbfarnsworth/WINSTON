import { expect, Page, Route, test } from '@playwright/test';

const alice = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Alice'
};
const bob = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Bob'
};

test('shows the signed-in user a running balance', async ({ page }) => {
  await mockApi(page);

  await page.goto('/home');

  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.getByText('Bob owes you $12.50')).toBeVisible();
});

test('creates a trip with the current user first', async ({ page }) => {
  let submittedTrip: Record<string, unknown> | undefined;
  await mockApi(page, async route => {
    if (route.request().method() !== 'POST') return false;
    submittedTrip = route.request().postDataJSON() as Record<string, unknown>;
    await fulfillJson(route, { ...submittedTrip, id: 'trip-1' }, 201);
    return true;
  });
  await page.goto('/trips/new');

  await expect(page.locator('h1 input')).toHaveValue('New Trip');
  await page.locator('app-currency-input input').first().fill('100');
  await page.getByRole('button', { name: '+ Add User' }).click();
  await expect(page.locator('app-user-select select')).toHaveCount(2);
  await page.getByRole('button', { name: 'Save Trip' }).click();

  await expect(page).toHaveURL(/\/trips$/);
  expect(submittedTrip).toBeDefined();
  const tripUsers = submittedTrip!['tripUsers'] as Array<{ userId: string }>;
  expect(tripUsers.map(user => user.userId)).toEqual([alice.id, bob.id]);
});

test('shows an access-request email for users outside the allow-list', async ({ page }) => {
  await mockApi(page);

  await page.goto('/access-denied');

  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
  const requestLink = page.getByRole('link', { name: 'Request access' });
  await expect(requestLink).toHaveAttribute('href', /mailto:owner@example\.com/);
  await expect(requestLink).toHaveAttribute('href', new RegExp(alice.id));
});

async function mockApi(
  page: Page,
  override?: (route: Route) => Promise<boolean>
): Promise<void> {
  await page.route('**/api/**', async route => {
    if (override && await override(route)) return;

    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    if (method === 'GET' && path === '/api/users/me') {
      await fulfillJson(route, alice);
    } else if (method === 'GET' && path === '/api/users') {
      await fulfillJson(route, [alice, bob]);
    } else if (method === 'GET' && path === '/api/users/balances') {
      await fulfillJson(route, { [bob.id]: 12.5 });
    } else if (method === 'GET' && path === '/api/trips') {
      await fulfillJson(route, []);
    } else if (method === 'GET' && path === '/api/transactions') {
      await fulfillJson(route, []);
    } else if (method === 'GET' && path === '/api/access-request') {
      await fulfillJson(route, {
        requestEmail: 'owner@example.com',
        objectId: alice.id
      });
    } else {
      await route.abort('failed');
    }
  });
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body)
  });
}
