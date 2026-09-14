Feature: Site health

  Scenario: All internal routes resolve
    Given the site has been crawled from the home page
    Then every internal route that was found responds with an ok status

  Scenario: No broken links are left behind
    Given the site has been crawled from the home page
    Then every internal link that was found points to an ok response
