using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixPaymentTransactionIdIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update existing empty string TransactionIds to null to avoid unique constraint violation
            migrationBuilder.Sql(@"
                UPDATE ""Payments""
                SET ""TransactionId"" = NULL
                WHERE ""TransactionId"" = '' OR (""TransactionId"" IS NOT NULL AND TRIM(""TransactionId"") = '');
            ");

            migrationBuilder.DropIndex(
                name: "IX_Payments_TransactionId",
                table: "Payments");

            // Check if columns exist before adding them
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'Bookings' AND column_name = 'ActualCheckInDate') THEN
                        ALTER TABLE ""Bookings"" ADD ""ActualCheckInDate"" timestamp with time zone;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                   WHERE table_name = 'Bookings' AND column_name = 'ActualCheckOutDate') THEN
                        ALTER TABLE ""Bookings"" ADD ""ActualCheckOutDate"" timestamp with time zone;
                    END IF;
                END $$;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TransactionId",
                table: "Payments",
                column: "TransactionId",
                unique: true,
                filter: "\"TransactionId\" IS NOT NULL AND \"TransactionId\" != ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Payments_TransactionId",
                table: "Payments");

            // Only drop columns if they exist (they might have been added in a different migration)
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'Bookings' AND column_name = 'ActualCheckInDate') THEN
                        ALTER TABLE ""Bookings"" DROP COLUMN ""ActualCheckInDate"";
                    END IF;
                    IF EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'Bookings' AND column_name = 'ActualCheckOutDate') THEN
                        ALTER TABLE ""Bookings"" DROP COLUMN ""ActualCheckOutDate"";
                    END IF;
                END $$;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TransactionId",
                table: "Payments",
                column: "TransactionId",
                unique: true,
                filter: "\"TransactionId\" IS NOT NULL");
        }
    }
}
