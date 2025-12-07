using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditableFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.DropColumn(
            //     name: "RoomType",
            //     table: "Rooms");

            // migrationBuilder.AlterColumn<int>(
            //     name: "Status",
            //     table: "ServiceRequests",
            //     type: "integer",
            //     nullable: false,
            //     oldClrType: typeof(string),
            //     oldType: "text");
            migrationBuilder.DropColumn(name: "Status", table: "ServiceRequests");
            migrationBuilder.AddColumn<int>(name: "Status", table: "ServiceRequests", type: "integer", nullable: false, defaultValue: 0);

            // migrationBuilder.AlterColumn<int>(
            //     name: "ServiceType",
            //     table: "ServiceRequests",
            //     type: "integer",
            //     nullable: false,
            //     oldClrType: typeof(string),
            //     oldType: "text");
            migrationBuilder.DropColumn(name: "ServiceType", table: "ServiceRequests");
            migrationBuilder.AddColumn<int>(name: "ServiceType", table: "ServiceRequests", type: "integer", nullable: false, defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "ServiceRequests",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "ServiceRequests",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "ServiceRequests",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "ServiceRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "ServiceRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "ServiceRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ServiceRequests",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "ServiceRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "ServiceRequests",
                type: "text",
                nullable: true);

            // migrationBuilder.AlterColumn<int>(
            //     name: "Status",
            //     table: "Rooms",
            //     type: "integer",
            //     nullable: false,
            //     oldClrType: typeof(string),
            //     oldType: "text");
            migrationBuilder.DropColumn(name: "Status", table: "Rooms");
            migrationBuilder.AddColumn<int>(name: "Status", table: "Rooms", type: "integer", nullable: false, defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "RoomNumber",
                table: "Rooms",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Rooms",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Rooms",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Rooms",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Rooms",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Rooms",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // migrationBuilder.AddColumn<int>(
            //     name: "RoomTypeId",
            //     table: "Rooms",
            //     type: "integer",
            //     nullable: false,
            //     defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Rooms",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TransactionId",
                table: "Payments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            // migrationBuilder.AlterColumn<int>(
            //     name: "Status",
            //     table: "Payments",
            //     type: "integer",
            //     nullable: false,
            //     oldClrType: typeof(string),
            //     oldType: "text");
            migrationBuilder.DropColumn(name: "Status", table: "Payments");
            migrationBuilder.AddColumn<int>(name: "Status", table: "Payments", type: "integer", nullable: false, defaultValue: 0);

            // migrationBuilder.AlterColumn<int>(
            //     name: "PaymentMethod",
            //     table: "Payments",
            //     type: "integer",
            //     nullable: false,
            //     oldClrType: typeof(string),
            //     oldType: "text");
            migrationBuilder.DropColumn(name: "PaymentMethod", table: "Payments");
            migrationBuilder.AddColumn<int>(name: "PaymentMethod", table: "Payments", type: "integer", nullable: false, defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Payments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Payments",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "HousekeepingTasks",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            // migrationBuilder.AlterColumn<int>(
            //     name: "Status",
            //     table: "HousekeepingTasks",
            //     type: "integer",
            //     nullable: false,
            //     oldClrType: typeof(string),
            //     oldType: "text");
            migrationBuilder.DropColumn(name: "Status", table: "HousekeepingTasks");
            migrationBuilder.AddColumn<int>(name: "Status", table: "HousekeepingTasks", type: "integer", nullable: false, defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "HousekeepingTasks",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "HousekeepingTasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "HousekeepingTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "HousekeepingTasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "HousekeepingTasks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "HousekeepingTasks",
                type: "text",
                nullable: true);

            // migrationBuilder.AlterColumn<int>(
            //     name: "Status",
            //     table: "Bookings",
            //     type: "integer",
            //     nullable: false,
            //     oldClrType: typeof(string),
            //     oldType: "text");
            migrationBuilder.DropColumn(name: "Status", table: "Bookings");
            migrationBuilder.AddColumn<int>(name: "Status", table: "Bookings", type: "integer", nullable: false, defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "SpecialRequests",
                table: "Bookings",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            // migrationBuilder.AlterColumn<int>(
            //     name: "PaymentStatus",
            //     table: "Bookings",
            //     type: "integer",
            //     nullable: false,
            //     oldClrType: typeof(string),
            //     oldType: "text");
            migrationBuilder.DropColumn(name: "PaymentStatus", table: "Bookings");
            migrationBuilder.AddColumn<int>(name: "PaymentStatus", table: "Bookings", type: "integer", nullable: false, defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Bookings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "Bookings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Bookings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Bookings",
                type: "text",
                nullable: true);

            // migrationBuilder.CreateTable(
            //     name: "RoomTypes",
            //     columns: table => new
            //     {
            //         Id = table.Column<int>(type: "integer", nullable: false)
            //             .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            //         Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
            //         Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
            //         BasePricePerNight = table.Column<decimal>(type: "numeric", nullable: false),
            //         MaxCapacity = table.Column<int>(type: "integer", nullable: false),
            //         Size = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
            //         CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            //         UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
            //         CreatedBy = table.Column<string>(type: "text", nullable: true),
            //         UpdatedBy = table.Column<string>(type: "text", nullable: true),
            //         IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
            //         DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
            //         DeletedBy = table.Column<string>(type: "text", nullable: true)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_RoomTypes", x => x.Id);
            //     });

            // Add missing columns to existing RoomTypes table
            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "RoomTypes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "RoomTypes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "RoomTypes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "RoomTypes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedBy",
                table: "RoomTypes",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StaffDutyRosters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StaffId = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Shift = table.Column<string>(type: "text", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: true),
                    EndTime = table.Column<TimeSpan>(type: "interval", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffDutyRosters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffDutyRosters_AspNetUsers_StaffId",
                        column: x => x.StaffId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceRequests_Status",
                table: "ServiceRequests",
                column: "Status");

            // migrationBuilder.CreateIndex(
            //     name: "IX_Rooms_RoomNumber",
            //     table: "Rooms",
            //     column: "RoomNumber",
            //     unique: true);

            // migrationBuilder.CreateIndex(
            //     name: "IX_Rooms_RoomTypeId",
            //     table: "Rooms",
            //     column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_Status",
                table: "Rooms",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_TransactionId",
                table: "Payments",
                column: "TransactionId",
                unique: true,
                filter: "\"TransactionId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_HousekeepingTasks_Status",
                table: "HousekeepingTasks",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_CheckInDate_CheckOutDate",
                table: "Bookings",
                columns: new[] { "CheckInDate", "CheckOutDate" });

            // migrationBuilder.CreateIndex(
            //     name: "IX_Bookings_Status",
            //     table: "Bookings",
            //     column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_StaffDutyRosters_StaffId_Date",
                table: "StaffDutyRosters",
                columns: new[] { "StaffId", "Date" });

            // migrationBuilder.AddForeignKey(
            //     name: "FK_Rooms_RoomTypes_RoomTypeId",
            //     table: "Rooms",
            //     column: "RoomTypeId",
            //     principalTable: "RoomTypes",
            //     principalColumn: "Id",
            //     onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Rooms_RoomTypes_RoomTypeId",
                table: "Rooms");

            migrationBuilder.DropTable(
                name: "RoomTypes");

            migrationBuilder.DropTable(
                name: "StaffDutyRosters");

            migrationBuilder.DropIndex(
                name: "IX_ServiceRequests_Status",
                table: "ServiceRequests");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_RoomNumber",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_RoomTypeId",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_Rooms_Status",
                table: "Rooms");

            migrationBuilder.DropIndex(
                name: "IX_Payments_TransactionId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_HousekeepingTasks_Status",
                table: "HousekeepingTasks");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_CheckInDate_CheckOutDate",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_Status",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "ServiceRequests");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "RoomTypeId",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Rooms");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "HousekeepingTasks");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "HousekeepingTasks");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "HousekeepingTasks");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "HousekeepingTasks");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "HousekeepingTasks");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Bookings");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "ServiceRequests",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "ServiceType",
                table: "ServiceRequests",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "ServiceRequests",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "ServiceRequests",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Rooms",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "RoomNumber",
                table: "Rooms",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Rooms",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RoomType",
                table: "Rooms",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "TransactionId",
                table: "Payments",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Payments",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentMethod",
                table: "Payments",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "HousekeepingTasks",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "HousekeepingTasks",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "HousekeepingTasks",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Bookings",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "SpecialRequests",
                table: "Bookings",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PaymentStatus",
                table: "Bookings",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }
    }
}
