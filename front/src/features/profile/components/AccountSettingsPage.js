import { Navbar } from "../../../core/layout/Navbar"
import { Footer } from "../../../core/layout/Footer"
import AccountSettings from "./AccountSettings"
import { Container } from "../../../shared/ui/components/Container" // Assuming you have a Container component

const AccountSettingsPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <Container className="flex-grow py-8 mt-16 mb-16 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account preferences and security</p>
        </div>
        <AccountSettings />
      </Container>
      <Footer />
    </div>
  )
}

export default AccountSettingsPage
