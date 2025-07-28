(function () {
  // Get the current pathname and redirect to root with the route as a parameter
  const currentPath = window.location.pathname;
  const searchParams = window.location.search;

  // If we're not already on the root, redirect to root with the current route
  if (currentPath !== "/") {
    const routeParam = currentPath.slice(1); // Remove leading slash

    const redirectUrl = `/?currentRoute=${routeParam}${searchParams ? searchParams : ""}`;
    window.location.href = redirectUrl;
  }
})();
