# TypeScript 5.7 - Documentation (April 2026)

Version: **5.7.2** | Node 22 Compatible: ✅

## Overview

TypeScript is a language for application-scale JavaScript with optional static typing.

## tsconfig.json for Node 22 (CommonJS)

```json
{
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"],
  "compilerOptions": {
    // Target configuration
    "target": "ES2022",
    "lib": ["ES2022"],

    // Module configuration (CommonJS for stability)
    "module": "commonjs",
    "moduleResolution": "Node",
    "rootDir": "./src",
    "outDir": "./dist",

    // Interop settings
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,

    // Strict mode
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "useUnknownInCatchVariables": true,

    // Emit settings
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,

    // Advanced
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    // Incremental compilation
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo"
  }
}
```

## Important Compiler Options

### Target

Specifies the JavaScript language version for emitted code.

```json
{
  "compilerOptions": {
    "target": "ES2022"  // For Node 22
  }
}
```

**Recommended for Node 22:**
- `ES2022` - Modern features (class fields, top-level await, etc.)

### Module

Determines module code generation.

```json
{
  "compilerOptions": {
    "module": "commonjs",      // or "nodenext" for ESM
    "moduleResolution": "Node" // or "nodenext" for ESM
  }
}
```

**CommonJS vs ES Modules:**

| Option | CommonJS | ES Modules (NodeNext) |
|--------|----------|----------------------|
| Syntax | `require`/`module.exports` | `import`/`export` |
| Config | `module: "commonjs"` | `module: "nodenext"` + package.json `"type": "module"` |
| Stability | ✅ Proven, stable | ⚠️ Newer, ecosystem still adapting |

### Lib

Specifies which built-in type definitions to include.

```json
{
  "compilerOptions": {
    "lib": ["ES2022"]
  }
}
```

Common combinations:
- `["ES2022"]` - Node 22 (no browser APIs)
- `["ES2022", "DOM"]` - Full stack (Node + browser)

### Strict Mode Options

```json
{
  "compilerOptions": {
    "strict": true,                              // All strict checks
    "noUnusedLocals": true,                      // Error on unused variables
    "noUnusedParameters": true,                  // Error on unused parameters
    "noImplicitOverride": true,                  // Require @override
    "noPropertyAccessFromIndexSignature": true,  // Require .get() on index access
    "noUncheckedIndexedAccess": true,            // Add undefined to indexed access
    "useUnknownInCatchVariables": true           // catch variables are unknown
  }
}
```

### verbatimModuleSyntax

**Replaces deprecated options:** `preserveValueImports`, `importsNotUsedAsValues`

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

This ensures correct module semantics and eliminates ambiguity about import behavior.

## Type System Features

### Unknown Type

For variables that could be anything:

```typescript
// In catch blocks (with useUnknownInCatchVariables)
try {
    // ...
} catch (error) {  // error is 'unknown'
    if (error instanceof Error) {
        console.log(error.message);
    }
}

// Type narrowing
function processValue(value: unknown) {
    if (typeof value === 'string') {
        // value is string here
        return value.toUpperCase();
    }
    if (typeof value === 'number') {
        // value is number here
        return value * 2;
    }
    throw new Error('Invalid value');
}
```

### Indexed Access Types

```typescript
type User = {
    name: string;
    age: number;
    email: string;
};

type UserName = User['name'];  // string

// With noUncheckedIndexedAccess
const users: User[] = [];
const first = users[0];  // User | undefined

// Safe access
const first = users[0];
if (first) {
    console.log(first.name);  // Safe
}
```

### Template Literal Types

```typescript
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<'click'>;  // 'onClick'

// Use with strings
type Color = 'red' | 'blue';
type CssVar = `--${Color}-color`;  // '--red-color' | '--blue-color'
```

### Conditional Types

```typescript
type NonNullable<T> = T extends null | undefined ? never : T;

type ApiResponse<T, E = Error> =
    T extends string ? { success: true; data: T } :
    T extends number ? { success: true; count: T } :
    { success: false; error: E };
```

## Utility Types

### Common Utility Types

```typescript
// Partial - make all properties optional
type PartialUser = Partial<User>;

// Required - make all properties required
type RequiredUser = Required<PartialUser>;

// Readonly - make all properties readonly
type ReadonlyUser = Readonly<User>;

// Pick - select specific properties
type UserBasic = Pick<User, 'name' | 'email'>;

// Omit - remove specific properties
type UserNoPassword = Omit<User, 'password'>;

// Record - create object type
type UserMap = Record<string, User>;

// Extract - extract from union
type Name = Extract<'name' | 'age' | 'email', string>;

// Exclude - exclude from union
type OtherProps = Exclude<keyof User, 'name' | 'email'>;

// ReturnType - get return type
type GetUserReturn = ReturnType<typeof getUser>;

// Parameters - get parameter types
type GetUserParams = Parameters<typeof getUser>;
```

## Type Guards

### Typeof Guards

```typescript
function process(value: string | number) {
    if (typeof value === 'string') {
        // value is string
        return value.toUpperCase();
    }
    // value is number
    return value.toFixed(2);
}
```

### Instanceof Guards

```typescript
class Dog { bark() {} }
class Cat { meow() {} }

function makeSound(pet: Dog | Cat) {
    if (pet instanceof Dog) {
        pet.bark();
    } else {
        pet.meow();
    }
}
```

### Custom Type Guards

```typescript
interface User {
    type: 'user';
    name: string;
}

interface Admin {
    type: 'admin';
    permissions: string[];
}

function isAdmin(account: User | Admin): account is Admin {
    return account.type === 'admin';
}

if (isAdmin(account)) {
    account.permissions;  // Available
}
```

### Discriminated Unions

```typescript
type Success = { status: 'success'; data: string };
type Error = { status: 'error'; message: string };
type Result = Success | Error;

function handle(result: Result) {
    if (result.status === 'success') {
        console.log(result.data);
    } else {
        console.log(result.message);
    }
}
```

## Decorators

### Class Decorators

```typescript
function sealed(constructor: Function) {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
}

@sealed
class MyClass {
    // ...
}
```

### Method Decorators

```typescript
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
        console.log(`Calling ${propertyKey} with`, args);
        return originalMethod.apply(this, args);
    };
}

class MyClass {
    @log
    myMethod(arg: string) {
        return arg;
    }
}
```

## Generic Types

### Basic Generics

```typescript
function identity<T>(arg: T): T {
    return arg;
}

const num = identity(42);      // 42
const str = identity('hello'); // 'hello'
```

### Generic Constraints

```typescript
interface Lengthwise {
    length: number;
}

function logLength<T extends Lengthwise>(arg: T): void {
    console.log(arg.length);
}

logLength({ length: 10, value: 'hi' });  // OK
logLength('hello');  // OK
// logLength(3);  // Error: no length property
```

### Generic Classes

```typescript
class Storage<T> {
    private items: T[] = [];

    add(item: T) {
        this.items.push(item);
    }

    get(index: number): T | undefined {
        return this.items[index];
    }
}

const userStorage = new Storage<User>();
userStorage.add({ name: 'John', age: 30 });
```

## Best Practices for Node 22

1. **Use ES2022 target** for modern JavaScript features
2. **Enable strict mode** for better type safety
3. **Use unknown** instead of any when possible
4. **Leverage type guards** for runtime type checking
5. **Prefer interface** for object shapes
6. **Use type** for unions, aliases, and primitives

---

**Source:** Context7 - /microsoft/typescript
**Last Updated:** 2026-04-07
