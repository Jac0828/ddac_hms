using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HMS.Domain.Models;

public class HotelSetting
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string HotelName { get; set; } = "HMS Luxury Hotel";
    public string WelcomeDescription { get; set; } = "Experience the epitome of luxury.";
    public string Email { get; set; } = "concierge@hmshotel.com";
    public string Phone { get; set; } = "+1 (555) 123-4567";
    public string Address { get; set; } = "123 Luxury Avenue";
    
    public string CheckInTime { get; set; } = "15:00";
    public string CheckOutTime { get; set; } = "11:00";
    
    public decimal TaxRate { get; set; } = 10.0m;
    public string Currency { get; set; } = "USD";

    // Social Media
    public string FacebookUrl { get; set; } = "";
    public string InstagramUrl { get; set; } = "";
    public string TwitterUrl { get; set; } = "";

    // Membership Discounts (Percentage, e.g., 10 for 10%)
    public decimal MemberDiscount { get; set; } = 5.0m; // Changed default to 5% for basic verified members
    public decimal SilverDiscount { get; set; } = 10.0m;
    public decimal GoldDiscount { get; set; } = 15.0m;
    public decimal PlatinumDiscount { get; set; } = 20.0m;

    // Membership Benefits (Stored as JSON string)
    // Format: { "member": ["Benefit 1"], "silver": ["Benefit 1", "Benefit 2"] }
    [Column(TypeName = "jsonb")]
    public string MembershipBenefitsJson { get; set; } = "{}";

    // Home Page Configuration
    [Column(TypeName = "jsonb")]
    public string HomeBannerImagesJson { get; set; } = "[]"; // JSON array of image URLs
    [Column(TypeName = "jsonb")]
    public string FeaturedOffersJson { get; set; } = "[]"; // JSON array of FeaturedOffer objects
    public string PromotionTitle { get; set; } = "Special Offer";
    public string PromotionDescription { get; set; } = "Book now and get 20% off";
    public string PromotionImageUrl { get; set; } = "";

    // About Section
    public string AboutTitle { get; set; } = "About Our Hotel";
    public string AboutDescription { get; set; } = "Experience luxury like never before.";
    public string AboutImageUrl { get; set; } = ""; // Added for About section image
}

