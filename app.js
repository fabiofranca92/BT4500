let auth0Client = null;

const fetchAuthConfig = () => fetch("./auth_config.json");


const configureClient = async () => {
    const response = await fetchAuthConfig();
    const config = await response.json();
  
    auth0Client = await auth0.createAuth0Client({
      domain: config.domain,
      clientId: config.clientId
    });
  };

  

  window.onload = async () => {
    await configureClient();
  }


  const login = async () => {
    await auth0Client.loginWithRedirect({
      authorizationParams: {
        redirect_uri: "https://localhost/home.html"
      }
    });
  };

  const logout = () => {
    auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };