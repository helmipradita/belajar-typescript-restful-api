import http from 'k6/http';
import {check, group} from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.95'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';
const MISSING_ID = 999999999;

function jsonParams(name, expectedStatus) {
  return {
    headers: {'Content-Type': 'application/json'},
    responseCallback: http.expectedStatuses(expectedStatus),
    tags: {name},
  };
}

function authParams(token, name, expectedStatus) {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    responseCallback: http.expectedStatuses(expectedStatus),
    tags: {name},
  };
}

function authOnlyParams(token, name, expectedStatus) {
  return {
    headers: {'Authorization': `Bearer ${token}`},
    responseCallback: http.expectedStatuses(expectedStatus),
    tags: {name},
  };
}

export default function () {
  const suffix = `${__VU}-${__ITER}-${Date.now()}`;
  const username = `k6-error-${suffix}`;
  const password = 'secret12345';
  let token = '';
  let contactId = null;
  let addressId = null;

  group('Seed valid user', function () {
    const res = http.post(`${BASE_URL}/api/v1/users`, JSON.stringify({
      username,
      password,
      name: `K6 Error ${suffix}`,
    }), jsonParams('SeedValidUser', 201));

    check(res, {'seed valid user status is 201': (r) => r.status === 201});
  });

  group('Duplicate user', function () {
    const res = http.post(`${BASE_URL}/api/v1/users`, JSON.stringify({
      username,
      password,
      name: `K6 Error ${suffix}`,
    }), jsonParams('DuplicateUser', 400));

    check(res, {'duplicate user status is 400': (r) => r.status === 400});
  });

  group('Wrong login', function () {
    const res = http.post(`${BASE_URL}/api/v1/users/login`, JSON.stringify({
      username,
      password: 'wrong-password',
    }), jsonParams('WrongLogin', 401));

    check(res, {'wrong login status is 401': (r) => r.status === 401});
  });

  group('Missing token', function () {
    const res = http.get(`${BASE_URL}/api/v1/users/current`, {
      responseCallback: http.expectedStatuses(401),
      tags: {name: 'MissingToken'},
    });

    check(res, {'missing token status is 401': (r) => r.status === 401});
  });

  group('Invalid token', function () {
    const res = http.get(`${BASE_URL}/api/v1/users/current`, authOnlyParams('invalid-token', 'InvalidToken', 401));

    check(res, {'invalid token status is 401': (r) => r.status === 401});
  });

  group('Login valid user', function () {
    const res = http.post(`${BASE_URL}/api/v1/users/login`, JSON.stringify({
      username,
      password,
    }), jsonParams('LoginValidUserForErrorTest', 200));

    const ok = check(res, {
      'valid login status is 200': (r) => r.status === 200,
      'valid login has token': (r) => r.json('data.access_token') !== undefined,
    });

    if (ok) {
      token = res.json('data.access_token');
    }
  });

  if (!token) {
    return;
  }

  group('Invalid contact body', function () {
    const res = http.post(`${BASE_URL}/api/v1/contacts`, JSON.stringify({
      first_name: '',
      last_name: '',
      email: 'not-an-email',
      phone: '08123456789012345678901234567890',
    }), authParams(token, 'InvalidContactBody', 400));

    check(res, {'invalid contact body status is 400': (r) => r.status === 400});
  });

  group('Contact not found', function () {
    const res = http.get(`${BASE_URL}/api/v1/contacts/${MISSING_ID}`, authOnlyParams(token, 'ContactNotFound', 404));

    check(res, {'contact not found status is 404': (r) => r.status === 404});
  });

  group('Seed valid contact', function () {
    const res = http.post(`${BASE_URL}/api/v1/contacts`, JSON.stringify({
      first_name: 'Error',
      last_name: 'Scenario',
      email: `${username}@example.com`,
      phone: '08123456789',
    }), authParams(token, 'SeedValidContact', 201));

    const ok = check(res, {
      'seed contact status is 201': (r) => r.status === 201,
      'seed contact has id': (r) => r.json('data.id') !== undefined,
    });

    if (ok) {
      contactId = res.json('data.id');
    }
  });

  if (contactId) {
    group('Invalid address body', function () {
      const res = http.post(`${BASE_URL}/api/v1/contacts/${contactId}/addresses`, JSON.stringify({
        street: 'Jalan Error',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        country: '',
        postal_code: '',
      }), authParams(token, 'InvalidAddressBody', 400));

      check(res, {'invalid address body status is 400': (r) => r.status === 400});
    });

    group('Address not found', function () {
      const res = http.get(`${BASE_URL}/api/v1/contacts/${contactId}/addresses/${MISSING_ID}`, authOnlyParams(token, 'AddressNotFound', 404));

      check(res, {'address not found status is 404': (r) => r.status === 404});
    });

    group('Seed valid address', function () {
      const res = http.post(`${BASE_URL}/api/v1/contacts/${contactId}/addresses`, JSON.stringify({
        street: 'Jalan Cleanup',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        country: 'Indonesia',
        postal_code: '11111',
      }), authParams(token, 'SeedValidAddress', 201));

      const ok = check(res, {
        'seed address status is 201': (r) => r.status === 201,
        'seed address has id': (r) => r.json('data.id') !== undefined,
      });

      if (ok) {
        addressId = res.json('data.id');
      }
    });

    if (addressId) {
      group('Cleanup address', function () {
        const res = http.del(`${BASE_URL}/api/v1/contacts/${contactId}/addresses/${addressId}`, null, authOnlyParams(token, 'CleanupAddress', 200));

        check(res, {'cleanup address status is 200': (r) => r.status === 200});
      });
    }

    group('Cleanup contact', function () {
      const res = http.del(`${BASE_URL}/api/v1/contacts/${contactId}`, null, authOnlyParams(token, 'CleanupContact', 200));

      check(res, {'cleanup contact status is 200': (r) => r.status === 200});
    });
  }

  group('Cleanup logout', function () {
    const res = http.del(`${BASE_URL}/api/v1/users/current`, null, authOnlyParams(token, 'CleanupLogout', 200));

    check(res, {'cleanup logout status is 200': (r) => r.status === 200});
  });
}
