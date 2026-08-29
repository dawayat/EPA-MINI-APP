import psycopg2
import sys

def main():
    # Connecting directly to IPv6 address of the Supabase instance
    conn_string = "postgresql://postgres:EPAMINIAPP91@[2a05:d018:cb7:ae02:db8d:5050:9a28:c296]:5432/postgres"
    
    try:
        print("Connecting to Supabase via IPv6 using psycopg2...")
        # Add connect_timeout to avoid hanging indefinitely if IPv6 is unreachable
        conn = psycopg2.connect(conn_string, connect_timeout=10)
        conn.autocommit = True
        print("Connected successfully.")
        
        sql_path = r"C:\Users\dawit\.gemini\antigravity\brain\68353094-a7c3-45c8-b1b0-f39c38ec8f4a\supabase_schema.sql"
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()
        
        print("Executing schema script...")
        with conn.cursor() as cur:
            cur.execute(sql)
            
        print("Schema applied successfully!")
        
    except Exception as e:
        print("Error executing schema:", e)
        sys.exit(1)

if __name__ == "__main__":
    main()
