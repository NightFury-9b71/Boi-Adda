# Password Input Component

## Usage

Import the component:
```jsx
import PasswordInput from '../components/PasswordInput';
```

Use in your forms:
```jsx
<PasswordInput
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="পাসওয়ার্ড"
  autoComplete="current-password"
/>
```

## Props

- `value` - The password value
- `onChange` - Change handler function
- `placeholder` - Placeholder text (default: "পাসওয়ার্ড")
- `className` - Additional CSS classes
- `autoComplete` - Auto-complete attribute
- `required` - Whether field is required
- `name` - Input name attribute
- Plus all other standard input props

## Features

- ✅ Show/hide password toggle
- ✅ Eye/EyeOff icons from Lucide React
- ✅ Consistent styling with existing forms
- ✅ Proper accessibility with tabIndex
- ✅ Bengali placeholder support
- ✅ Auto-complete support

## Updated Components

1. **LandingPage.jsx** - Login and Registration forms
2. **AdminUserManagement.jsx** - User creation form
3. **PasswordInput.jsx** - New reusable component
