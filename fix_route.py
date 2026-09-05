import os

with open('backend/main.py', 'r') as f:
    lines = f.readlines()

search_start = None
for i, l in enumerate(lines):
    if '@app.get("/api/orders/search")' in l:
        search_start = i
        break

if search_start:
    search_block = lines[search_start:]
    lines = lines[:search_start]
    
    insert_idx = None
    for i, l in enumerate(lines):
        if '@app.get("/api/orders/{order_number}")' in l:
            insert_idx = i
            break
            
    if insert_idx:
        lines = lines[:insert_idx] + search_block + lines[insert_idx:]
        with open('backend/main.py', 'w') as f:
            f.writelines(lines)
        print('Moved block successfully')
