## Key Generation Instructions (Temporary)

### Prerequisites
Make sure that the `/keys` folder is located in the root directory of the project. The keys will be generated and saved in this folder.

### Steps to Generate Keys:

1. **Navigate to the project root directory.**
   
2. **Run the following commands to generate the private and public keys:**

```
openssl genrsa -out keys/private.key 2048
openssl rsa -in keys/private.key -pubout -out keys/public.key
chmod 600 keys/private.key
chmod 644 keys/public.key
```

This will generate:
- `private.key` and `public.key` inside the `keys` folder.
- `private.key` will have restricted permissions (`chmod 600`).
- `public.key` will be readable by others (`chmod 644`).

### Important Notes:
- Make sure the `/keys` folder is ignored by Git (it's already in `.gitignore`).
- These keys will be used for authentication and JWT signing in the project.

