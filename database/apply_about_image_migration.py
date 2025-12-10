import os
import subprocess

def apply_migration():
    migration_file = "database/migrations/007_add_about_image_url.sql"
    
    # Get database connection details from environment variables or use defaults
    db_host = os.environ.get("DB_HOST", "hotelmanagementsystem.cq7oeyco0q9s.us-east-1.rds.amazonaws.com")
    db_port = os.environ.get("DB_PORT", "5432")
    db_name = os.environ.get("DB_NAME", "postgres")
    db_user = os.environ.get("DB_USER", "postgres")
    db_password = os.environ.get("DB_PASSWORD", "admin1234")

    # Construct the psql command
    # Using PGPASSWORD environment variable to pass password
    env = os.environ.copy()
    env["PGPASSWORD"] = db_password

    command = [
        "psql",
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", db_name,
        "-f", migration_file
    ]

    print(f"Applying migration: {migration_file}...")
    try:
        subprocess.run(command, env=env, check=True)
        print("Migration applied successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error applying migration: {e}")

if __name__ == "__main__":
    apply_migration()





