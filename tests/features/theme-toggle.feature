Feature: Theme toggle

  Scenario: Switching the theme persists across a reload
    Given I am on the home page
    When I note the current theme
    And I toggle the theme
    Then the theme should have changed
    When I reload the page
    Then the theme should still be the toggled value
