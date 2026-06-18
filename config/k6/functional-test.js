import http from 'k6/http';
import {check, group} from 'k6';

export const options = {
  vus: 50,
  iterations: 500,
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
  const id = `${__VU}-${__ITER}-${Date.now()}`;
  const username = `func-${id}`;
  const password = 'secret12345';
  let token = '';
  let contactId = null;
  let addressId = null;

  group('Monitoring healthz', function () {
    const res = http.get(`${BASE_URL}/api/v1/healthz`, {
      responseCallback: http.expectedStatuses(200),
      tags: {name: 'Healthz'},
    });
    check(res, {
      'healthz status is 200': (r) => r.status === 200,
      'healthz body is OK': (r) => r.body === 'OK',
    });
  });

  group('Monitoring health', function () {
    const res = http.get(`${BASE_URL}/api/v1/health`, {
      responseCallback: http.expectedStatuses(200),
      tags: {name: 'Health'},
    });
    check(res, {
      'health status is 200': (r) => r.status === 200,
      'health response is healthy': (r) => r.json('status') === 'healthy',
    });
  });

  group('Register user', function () {
    const res = http.post(`${BASE_URL}/api/v1/users`, JSON.stringify({
      username,
      password,
      name: `Func ${id}`,
    }), jsonParams('RegisterUser', 201));

    check(res, {
      'register status is 201': (r) => r.status === 201,
      'register returns username': (r) => r.json('data.username') === username,
    });
  });

  group('Duplicate user', function () {
    const res = http.post(`${BASE_URL}/api/v1/users`, JSON.stringify({
      username,
      password,
      name: `Func ${id}`,
    }), jsonParams('DuplicateUser', 400));

    check(res, {
      'duplicate user status is 400': (r) => r.status === 400,
      'duplicate has error message': (r) => r.json('errors') !== undefined,
    });
  });

  group('Wrong password login', function () {
    const res = http.post(`${BASE_URL}/api/v1/users/login`, JSON.stringify({
      username,
      password: 'wrong-password',
    }), jsonParams('WrongLogin', 401));

    check(res, {
      'wrong login status is 401': (r) => r.status === 401,
    });
  });

  group('Missing token', function () {
    const res = http.get(`${BASE_URL}/api/v1/users/current`, {
      responseCallback: http.expectedStatuses(401),
      tags: {name: 'MissingToken'},
    });

    check(res, {
      'missing token status is 401': (r) => r.status === 401,
    });
  });

  group('Invalid token', function () {
    const res = http.get(`${BASE_URL}/api/v1/users/current`, {
      headers: {'Authorization': 'Bearer invalid-token-value'},
      responseCallback: http.expectedStatuses(401),
      tags: {name: 'InvalidToken'},
    });

    check(res, {
      'invalid token status is 401': (r) => r.status === 401,
    });
  });

  group('Login user', function () {
    const res = http.post(`${BASE_URL}/api/v1/users/login`, JSON.stringify({
      username,
      password,
    }), jsonParams('LoginUser', 200));

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
    const res = http.get(`${BASE_URL}/api/v1/users/current`, authOnlyParams(token, 'GetCurrentUser', 200));

    check(res, {
      'get current user status is 200': (r) => r.status === 200,
      'current user is correct': (r) => r.json('data.username') === username,
    });
  });

  group('Update current user', function () {
    const updatedName = `Func Updated ${id}`;
    const res = http.patch(`${BASE_URL}/api/v1/users/current`, JSON.stringify({
      name: updatedName,
    }), authParams(token, 'UpdateCurrentUser', 200));

    check(res, {
      'update user status is 200': (r) => r.status === 200,
      'user name updated': (r) => r.json('data.name') === updatedName,
    });
  });

  group('Contact not found', function () {
    const res = http.get(`${BASE_URL}/api/v1/contacts/${MISSING_ID}`, authOnlyParams(token, 'ContactNotFound', 404));

    check(res, {
      'contact not found status is 404': (r) => r.status === 404,
    });
  });

  group('Create contact', function () {
    const res = http.post(`${BASE_URL}/api/v1/contacts`, JSON.stringify({
      first_name: 'Functional',
      last_name: 'Test',
      email: `${username}@example.com`,
      phone: '08123456789',
    }), authParams(token, 'CreateContact', 201));

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
      const res = http.get(`${BASE_URL}/api/v1/contacts/${contactId}`, authOnlyParams(token, 'GetContact', 200));

      check(res, {
        'get contact status is 200': (r) => r.status === 200,
        'get contact id is correct': (r) => r.json('data.id') === contactId,
      });
    });

    group('Update contact', function () {
      const res = http.put(`${BASE_URL}/api/v1/contacts/${contactId}`, JSON.stringify({
        first_name: 'FuncUpdated',
        last_name: 'TestUpdated',
        email: `${username}.updated@example.com`,
        phone: '08123456780',
      }), authParams(token, 'UpdateContact', 200));

      check(res, {
        'update contact status is 200': (r) => r.status === 200,
        'contact first name updated': (r) => r.json('data.first_name') === 'FuncUpdated',
      });
    });

    group('Search contacts', function () {
      const res = http.get(`${BASE_URL}/api/v1/contacts?name=FuncUpdated&page=1&size=10`, authOnlyParams(token, 'SearchContacts', 200));

      check(res, {
        'search contacts status is 200': (r) => r.status === 200,
        'search returns data array': (r) => Array.isArray(r.json('data')),
        'search returns paging': (r) => r.json('paging') !== undefined,
      });
    });

    group('Address not found', function () {
      const res = http.get(`${BASE_URL}/api/v1/contacts/${contactId}/addresses/${MISSING_ID}`, authOnlyParams(token, 'AddressNotFound', 404));

      check(res, {
        'address not found status is 404': (r) => r.status === 404,
      });
    });

    group('Create address', function () {
      const res = http.post(`${BASE_URL}/api/v1/contacts/${contactId}/addresses`, JSON.stringify({
        street: 'Jalan Functional',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        country: 'Indonesia',
        postal_code: '11111',
      }), authParams(token, 'CreateAddress', 201));

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
        const res = http.get(`${BASE_URL}/api/v1/contacts/${contactId}/addresses/${addressId}`, authOnlyParams(token, 'GetAddress', 200));

        check(res, {
          'get address status is 200': (r) => r.status === 200,
          'get address id is correct': (r) => r.json('data.id') === addressId,
        });
      });

      group('Update address', function () {
        const res = http.put(`${BASE_URL}/api/v1/contacts/${contactId}/addresses/${addressId}`, JSON.stringify({
          street: 'Jalan Functional Updated',
          city: 'Bandung',
          province: 'Jawa Barat',
          country: 'Indonesia',
          postal_code: '22222',
        }), authParams(token, 'UpdateAddress', 200));

        check(res, {
          'update address status is 200': (r) => r.status === 200,
          'address city updated': (r) => r.json('data.city') === 'Bandung',
        });
      });

      group('List addresses', function () {
        const res = http.get(`${BASE_URL}/api/v1/contacts/${contactId}/addresses`, authOnlyParams(token, 'ListAddresses', 200));

        check(res, {
          'list addresses status is 200': (r) => r.status === 200,
          'list addresses returns array': (r) => Array.isArray(r.json('data')),
        });
      });

      group('Delete address', function () {
        const res = http.del(`${BASE_URL}/api/v1/contacts/${contactId}/addresses/${addressId}`, null, authOnlyParams(token, 'DeleteAddress', 200));

        check(res, {
          'delete address status is 200': (r) => r.status === 200,
          'delete address returns OK': (r) => r.json('data') === 'OK',
        });
      });
    }

    group('Delete contact', function () {
      const res = http.del(`${BASE_URL}/api/v1/contacts/${contactId}`, null, authOnlyParams(token, 'DeleteContact', 200));

      check(res, {
        'delete contact status is 200': (r) => r.status === 200,
        'delete contact returns OK': (r) => r.json('data') === 'OK',
      });
    });
  }

  group('Logout user', function () {
    const res = http.del(`${BASE_URL}/api/v1/users/current`, null, authOnlyParams(token, 'LogoutUser', 200));

    check(res, {
      'logout status is 200': (r) => r.status === 200,
      'logout returns OK': (r) => r.json('data') === 'OK',
    });
  });
}
