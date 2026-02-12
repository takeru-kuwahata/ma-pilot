#!/usr/bin/env python3
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')

supabase: Client = create_client(url, key)

# Test login
try:
    result = supabase.auth.sign_in_with_password({
        'email': 'kuwahata@idw-japan.net',
        'password': 'advance2026'
    })
    print('✅ Login successful!')
    print(f'User: {result.user.email}')
    print(f'Token: {result.session.access_token[:50]}...')
except Exception as e:
    print(f'❌ Login failed: {e}')
