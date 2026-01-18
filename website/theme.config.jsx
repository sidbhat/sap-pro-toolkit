export default {
  logo: <span>SF Pro Toolkit</span>,
  project: {
    link: 'https://github.com/sidbhat/sf-pro-toolkit'
  },
  docsRepositoryBase: 'https://github.com/sidbhat/sf-pro-toolkit/tree/main/website',
  footer: {
    text: 'SF Pro Toolkit - Made with ❤️ by the SAP Community'
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – SF Pro Toolkit'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="SF Pro Toolkit" />
      <meta property="og:description" content="Supercharge your SAP workflows with AI-powered insights, quick actions, and community profiles" />
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
