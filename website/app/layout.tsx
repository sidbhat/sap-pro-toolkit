import './globals.css'

export const metadata = {
  title: 'SAP Pro Toolkit Community Hub',
  description: 'Community-driven profiles, documentation, and contributions for SAP Pro Toolkit',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header>
            <nav>
              <div className="logo">
                <h1>SAP Pro Toolkit</h1>
                <span className="subtitle">Community Hub</span>
              </div>
              <ul className="nav-links">
                <li><a href="/">Home</a></li>
                <li><a href="/profiles">Profiles</a></li>
                <li><a href="/contributing">Contributing</a></li>
                <li><a href="https://github.com/sidbhat/sap-pro-toolkit" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              </ul>
            </nav>
          </header>
          <main>{children}</main>
          <footer>
            <p>Made with ❤️ by the SAP Community</p>
          </footer>
        </div>
      </body>
    </html>
  )
}
