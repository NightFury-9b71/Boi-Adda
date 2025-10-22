# Email Templates for বই আড্ডা

Beautiful, branded email templates for user verification in বই আড্ডা (Book Club) platform.

## 📧 Available Templates

### 1. **verify_email.html** - OTP Verification
- For 6-digit OTP code verification
- Use when: Email confirmations using OTP instead of magic links

### 2. **magic_link.html** - Magic Link Verification  
- For clickable verification links
- Use when: Traditional email confirmation with links

---

## 🎨 Template Features

✅ **Brand Identity**
- Green gradient theme matching website
- Book icon logo
- Bengali language content
- "বই আড্ডা" branding throughout

✅ **User Experience**
- Mobile responsive design
- Clean, modern layout
- Clear call-to-action buttons
- Security tips included
- Stats showcase (members, books, donations)

✅ **Design Elements**
- Gradient headers with wave pattern
- Animated logo
- Heartbeat animation on "♥"
- Rounded corners and shadows
- Beautiful color scheme

---

## 🚀 How to Use in Supabase

### Step 1: Access Email Templates
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `tdtnxwyhttbchhxpsiqe`
3. Navigate to: **Authentication** → **Email Templates**

### Step 2: Configure for OTP (Recommended)
**For OTP Verification:**

1. Go to **Authentication** → **Providers** → **Email**
2. Enable: **"Enable email confirmations using OTP instead of magic links"** ✅
3. Click **Save**
4. Go back to **Email Templates** → **Confirm signup**
5. Copy content from `verify_email.html`
6. Paste into template editor
7. **Important Variables:**
   - `{{ .Token }}` - The 6-digit OTP code
   - Keep this variable in the template!

### Step 3: Configure for Magic Link (Alternative)
**For Magic Link Verification:**

1. Go to **Authentication** → **Email Templates** → **Magic Link**
2. Copy content from `magic_link.html`
3. Paste into template editor
4. **Important Variables:**
   - `{{ .ConfirmationURL }}` - The verification link
   - Keep this variable in the template!

---

## 📝 Template Variables

Supabase provides these variables that you can use in templates:

| Variable | Description | Used In |
|----------|-------------|---------|
| `{{ .Token }}` | 6-digit OTP code | verify_email.html |
| `{{ .ConfirmationURL }}` | Verification link | magic_link.html |
| `{{ .SiteURL }}` | Your site URL | Both |
| `{{ .TokenHash }}` | Token hash | Both |

---

## 🎯 Customization Guide

### Update Stats Numbers
Find this section in both templates:
```html
<div class="footer-stats">
    <div class="stat">
        <span class="stat-number">500+</span>  <!-- Change this -->
        <span class="stat-label">সদস্য</span>
    </div>
    <!-- ... -->
</div>
```

### Update Social Links
```html
<div class="social-links">
    <a href="https://facebook.com/yourpage">Facebook</a>
    <a href="https://twitter.com/yourhandle">Twitter</a>
    <a href="https://instagram.com/yourhandle">Instagram</a>
</div>
```

### Change Colors
Find and replace color codes:
- **Primary Green**: `#10b981` → Your color
- **Dark Green**: `#059669` → Your darker shade
- **Background**: `#e8f5e9` → Your background

---

## 🧪 Testing Templates

### Test OTP Flow:
1. Register a new account
2. Check email for 6-digit code
3. Verify format matches `verify_email.html` design
4. Enter code on website

### Test Magic Link Flow:
1. Register a new account
2. Check email for verification button
3. Click button or copy link
4. Verify it redirects correctly

---

## 📱 Mobile Preview

Both templates are fully responsive:
- **Desktop**: Full layout with all elements
- **Tablet**: Optimized spacing
- **Mobile**: Single column, larger touch targets

Test on:
- Gmail (Mobile & Desktop)
- Yahoo Mail
- Outlook
- Apple Mail
- Mobile browsers

---

## 🔧 Troubleshooting

### OTP Code Not Showing
- Ensure `{{ .Token }}` variable exists in template
- Check Supabase OTP is enabled
- Verify backend uses `verify_otp()` method

### Magic Link Not Working
- Ensure `{{ .ConfirmationURL }}` variable exists
- Check redirect URL in Supabase settings
- Verify Site URL is configured correctly

### Styling Issues
- Some email clients strip `<style>` tags
- Use inline styles for critical elements
- Test in multiple email clients

---

## 💡 Best Practices

1. **Keep It Simple**: Don't overcomplicate email HTML
2. **Test Everywhere**: Different email clients render differently
3. **Mobile First**: Most users check email on mobile
4. **Clear CTA**: Make buttons obvious and clickable
5. **Include Plain Text**: Always have fallback text version
6. **Security First**: Include security tips in emails
7. **Brand Consistency**: Match website design and colors

---

## 📞 Support

For questions or issues:
- **Developer**: Abdullah Al Noman
- **Email**: nomanstine@gmail.com
- **Project**: বই আড্ডা (Book Club)
- **Institution**: যশোর বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় (JUST)

---

## 📄 License

These templates are part of the বই আড্ডা project.
© ২০২৫ বই আড্ডা। সকল অধিকার সংরক্ষিত।

Made with ♥ at JUST
