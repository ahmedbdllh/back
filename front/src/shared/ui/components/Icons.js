export const CheckCircleIcon = ({ className = "" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  )
}

const IconWrapper = ({ d, className, viewBox = "0 0 24 24" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

export const Icons = {
  Copy: (props) => <IconWrapper d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2m8 0V2a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2m8 0H8" {...props} />,
  Mail: (props) => <IconWrapper d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z m18 2l-10 7L2 6" {...props} />,
  Lock: (props) => <IconWrapper d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4" {...props} />,
  Key: (props) => <IconWrapper d="M21 2l-2.5 2.5M15.5 9.5L12 6l-2.5 2.5M12 6V2m0 4a2.5 2.5 0 00-5 0v3.5c0 .8.3 1.5.8 2l3.7 3.7c.5.5 1.2.8 2 .8s1.5-.3 2-.8l3.7-3.7c.5-.5.8-1.2.8-2V8.5a2.5 2.5 0 00-5 0M12 15a1 1 0 100-2 1 1 0 000 2z" viewBox="0 0 24 24" {...props} />,
  Spinner: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  Close: (props) => <IconWrapper d="M18 6L6 18M6 6l12 12" {...props} />,
  User: (props) => <IconWrapper d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" {...props} />,
  IdCard: (props) => <IconWrapper d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z M6 8h4 M6 12h8 M6 16h6" {...props} />,
  Phone: (props) => <IconWrapper d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" {...props} />,
  CheckCircle: CheckCircleIcon,
  AlertCircle: (props) => <IconWrapper d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 8v4 M12 16h.01" {...props} />,
  AlertTriangle: (props) => <IconWrapper d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" {...props} />,
  Settings: (props) => <IconWrapper d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" {...props} />,
  Shield: (props) => <IconWrapper d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...props} />,
  Menu: (props) => <IconWrapper d="M3 12h18 M3 6h18 M3 18h18" {...props} />,
  Camera: (props) => <IconWrapper d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z M12 17a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" {...props} />,
  X: (props) => <IconWrapper d="M18 6L6 18M6 6l12 12" {...props} />,
  ShieldCheck: (props) => <IconWrapper d="M9 12l2 2 4-4 M21 12c0 1.7-.4 3.3-1.2 4.7-.8 1.5-2 2.7-3.6 3.5-1.5.8-3.2 1.2-4.9 1.2-1.7 0-3.4-.4-4.9-1.2-1.6-.8-2.8-2-3.6-3.5C2.4 15.3 2 13.7 2 12c0-5.5 4.5-10 10-10s10 4.5 10 10z" {...props} />,
  Monitor: (props) => <IconWrapper d="M2 3h20v14H2z M8 21h8 M12 17v4" {...props} />,
  Sun: (props) => <IconWrapper d="M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42 M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" {...props} />,
  Moon: (props) => <IconWrapper d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" {...props} />,
  Bell: (props) => <IconWrapper d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M13.73 21a2 2 0 0 1-3.46 0" {...props} />,
  Smartphone: (props) => <IconWrapper d="M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z M12 18h.01" {...props} />,
  Tablet: (props) => <IconWrapper d="M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" {...props} />,
  XCircle: (props) => <IconWrapper d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M15 9l-6 6 M9 9l6 6" {...props} />,
  RefreshCw: (props) => <IconWrapper d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16 M3 21v-5h5" {...props} />,
  Activity: (props) => <IconWrapper d="M22 12h-4l-3 9L9 3l-3 9H2" {...props} />,
  Trophy: (props) => <IconWrapper d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M12 12.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z M12 7.5V12 M8 21l4-7 4 7" {...props} />,
  Target: (props) => <IconWrapper d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" {...props} />,
  Clock: (props) => <IconWrapper d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2" {...props} />,
  Star: (props) => <IconWrapper d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...props} />,
  Award: (props) => <IconWrapper d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8 15L6 21l6-2 6 2-2-6" {...props} />,
  Users: (props) => <IconWrapper d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" {...props} />,
  MapPin: (props) => <IconWrapper d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" {...props} />,
  Share: (props) => <IconWrapper d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13" {...props} />,
  Edit: (props) => <IconWrapper d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" {...props} />,
  ChevronRight: (props) => <IconWrapper d="M9 18l6-6-6-6" {...props} />,
  TrendingUp: (props) => <IconWrapper d="M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6" {...props} />,
  TrendingDown: (props) => <IconWrapper d="M23 18l-9.5-9.5-5 5L1 6 M17 18h6v-6" {...props} />,
  Eye: (props) => <IconWrapper d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" {...props} />,
  EyeOff: (props) => <IconWrapper d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24 M1 1l22 22" {...props} />,
  Building2: (props) => <IconWrapper d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z M6 12h12 M14 12h2 M14 16h2 M14 8h2 M10 12h2 M10 16h2 M10 8h2" {...props} />,
  ChevronDown: (props) => <IconWrapper d="M6 9l6 6 6-6" {...props} />,
  PlusCircle: (props) => <IconWrapper d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 8v8 M8 12h8" {...props} />,
  Trash2: (props) => <IconWrapper d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6" {...props} />,
  Save: (props) => <IconWrapper d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8" {...props} />,
};
