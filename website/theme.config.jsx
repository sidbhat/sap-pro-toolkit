export default {
  logo: <span>SAP Pro Toolkit</span>,
  project: {
    link: 'https://github.com/sidbhat/sap-pro-toolkit'
  },
  docsRepositoryBase: 'https://github.com/sidbhat/sap-pro-toolkit/tree/main/website',
  footer: {
    text: 'SAP Pro Toolkit - Made with ❤️ by the SAP Community'
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – SF Pro Toolkit'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="SAP Pro Toolkit" />
      <meta property="og:description" content="Community-driven profiles, documentation, and contributions for SAP Pro Toolkit" />
    </>
  ),
  primaryHue: 210,
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  navigation: {
    prev: true,
    next: true
  }
}
