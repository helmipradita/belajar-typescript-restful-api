import http from 'k6/http';
import {check, group, sleep} from 'k6';

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    {duration: '1m', target: 20},
    {duration: '3m', target: 20},
    {duration: '1m', target: 0},
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

function jsonParams(name) {
  return {
    headers: {'Content-Type': 'application/json'},
    tags: {name},
  };
}

function authParams(token, name) {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    tags: {name},
  };
}

function authOnlyParams(token, name) {
  return {
    headers: {'Authorization': `Bearer ${token}`},
    tags: {name},
  };
}

export function setup() {
  const username = `k6-cleanup-${Date.now()}`;
  const password = 'cleanup123';

  http.post(`${BASE_URL}/api/v1/users`, JSON.stringify({
    username,
    password,
    name: 'K6 Cleanup',
  }), jsonParams('SetupUser'));

  const loginRes = http.post(`${BASE_URL}/api/v1/users/login`, JSON.stringify({
    username,
    password,
  }), jsonParams('SetupLogin'));

  return {cleanupUser: username, cleanupToken: loginRes.json('data.access_token')};
}

export function teardown(data) {
  if (data.cleanupToken) {
    http.del(`${BASE_URL}/api/v1/users/current`, null,
      authOnlyParams(data.cleanupToken, 'TeardownLogout'));
  }
}

export default function () {
  const suffix = `${__VU}-${__ITER}-${Date.now()}`;
  const username = `k6-${suffix}`;
  const password = 'secret12345';
  let token = '';
  let contactId = null;
  let addressId = null;

  try {
    group('Register user', function () {
      const res = http.post(`${BASE_URL}/api/v1/users`, JSON.stringify({
        username,
        password,
        name: `K6 ${suffix}`,
      }), jsonParams('RegisterUser'));

      check(res, {
        'register status is 201': (r) => r.status === 201,
        'register returns username': (r) => r.json('data.username') === username,
      });
    });

    group('Login user', function () {
      const res = http.post(`${BASE_URL}/api/v1/users/login`, JSON.stringify({
        username,
        password,
      }), jsonParams('LoginUser'));

      const ok = check(res, {
        'login status is 200': (r) => r.status === 200,
        'login has token': (r) => r.json('data.access_token') !== undefined,
      });

      if (ok) {
        token = res.json('data.access_token');
      }
    });

    if (!token) {
      return;
    }

    group('Get current user', function () {
      const res = http.get(`${BASE_URL}/api/v1/users/current`, authOnlyParams(token, 'GetCurrentUser'));

      check(res, {
        'current user status is 200': (r) => r.status === 200,
        'current user is correct': (r) => r.json('data.username') === username,
      });
    });

    group('Update current user', function () {
      const updatedName = `K6 Updated ${suffix}`;
      const res = http.patch(`${BASE_URL}/api/v1/users/current`, JSON.stringify({
        name: updatedName,
      }), authParams(token, 'UpdateCurrentUser'));

      check(res, {
        'update current user status is 200': (r) => r.status === 200,
        'current user name updated': (r) => r.json('data.name') === updatedName,
      });
    });

    group('Create contact', function () {
      const res = http.post(`${BASE_URL}/api/v1/contacts`, JSON.stringify({
        first_name: 'Load',
        last_name: 'Test',
        email: `${username}@example.com`,
        phone: '08123456789',
      }), authParams(token, 'CreateContact'));

      const ok = check(res, {
        'create contact status is 201': (r) => r.status === 201,
        'create contact has id': (r) => r.json('data.id') !== undefined,
      });

      if (ok) {
        contactId = res.json('data.id');
      }
    });

    if (contactId) {
      group('Get contact', function () {
        const res = http.get(`${BASE_URL}/api/v1/contacts/${contactId}`, authOnlyParams(token, 'GetContact'));

        check(res, {
          'get contact status is 200': (r) => r.status === 200,
          'get contact id is correct': (r) => r.json('data.id') === contactId,
        });
      });

      group('Update contact', function () {
        const res = http.put(`${BASE_URL}/api/v1/contacts/${contactId}`, JSON.stringify({
          first_name: 'LoadUpdated',
          last_name: 'TestUpdated',
          email: `${username}.updated@example.com`,
          phone: '08123456780',
        }), authParams(token, 'UpdateContact'));

        check(res, {
          'update contact status is 200': (r) => r.status === 200,
          'contact first name updated': (r) => r.json('data.first_name') === 'LoadUpdated',
        });
      });

      group('Search contacts', function () {
        const res = http.get(`${BASE_URL}/api/v1/contacts?name=LoadUpdated&page=1&size=10`, authOnlyParams(token, 'SearchContacts'));

        check(res, {
          'search contacts status is 200': (r) => r.status === 200,
          'search contacts returns data array': (r) => Array.isArray(r.json('data')),
          'search contacts returns paging': (r) => r.json('paging') !== undefined,
        });
      });

      group('Create address', function () {
        const res = http.post(`${BASE_URL}/api/v1/contacts/${contactId}/addresses`, JSON.stringify({
          street: 'Jalan K6',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          country: 'Indonesia',
          postal_code: '11111',
        }), authParams(token, 'CreateAddress'));

        const ok = check(res, {
          'create address status is 201': (r) => r.status === 201,
          'create address has id': (r) => r.json('data.id') !== undefined,
        });

        if (ok) {
          addressId = res.json('data.id');
        }
      });

      if (addressId) {
        group('Get address', function () {
          const res = http.get(`${BASE_URL}/api/v1/contacts/${contactId}/addresses/${addressId}`, authOnlyParams(token, 'GetAddress'));

          check(res, {
            'get address status is 200': (r) => r.status === 200,
            'get address id is correct': (r) => r.json('data.id') === addressId,
          });
        });

        group('Update address', function () {
          const res = http.put(`${BASE_URL}/api/v1/contacts/${contactId}/addresses/${addressId}`, JSON.stringify({
            street: 'Jalan K6 Updated',
            city: 'Bandung',
            province: 'Jawa Barat',
            country: 'Indonesia',
            postal_code: '22222',
          }), authParams(token, 'UpdateAddress'));

          check(res, {
            'update address status is 200': (r) => r.status === 200,
            'address city updated': (r) => r.json('data.city') === 'Bandung',
          });
        });

        group('List addresses', function () {
          const res = http.get(`${BASE_URL}/api/v1/contacts/${contactId}/addresses`, authOnlyParams(token, 'ListAddresses'));

          check(res, {
            'list addresses status is 200': (r) => r.status === 200,
            'list addresses returns array': (r) => Array.isArray(r.json('data')),
          });
        });
      }
    }
  } finally {
    if (addressId) {
      http.del(`${BASE_URL}/api/v1/contacts/${contactId}/addresses/${addressId}`, null,
        authOnlyParams(token, 'CleanupAddress'));
    }
    if (contactId) {
      http.del(`${BASE_URL}/api/v1/contacts/${contactId}`, null,
        authOnlyParams(token, 'CleanupContact'));
    }
    if (token) {
      http.del(`${BASE_URL}/api/v1/users/current`, null,
        authOnlyParams(token, 'CleanupLogout'));
    }
  }

  sleep(1);
}
