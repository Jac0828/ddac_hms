using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHomeContentSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HomeBannerImagesJson",
                table: "HotelSettings",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PromotionDescription",
                table: "HotelSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PromotionImageUrl",
                table: "HotelSettings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PromotionTitle",
                table: "HotelSettings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HomeBannerImagesJson",
                table: "HotelSettings");

            migrationBuilder.DropColumn(
                name: "PromotionDescription",
                table: "HotelSettings");

            migrationBuilder.DropColumn(
                name: "PromotionImageUrl",
                table: "HotelSettings");

            migrationBuilder.DropColumn(
                name: "PromotionTitle",
                table: "HotelSettings");
        }
    }
}
