Feature: Language switch on a case study page

  Scenario: Switching language keeps the same case study, not the home page
    Given I start from the home page
    When I open the featured case study "Optimizing the Cypress test pipeline"
    And I switch the language to Portuguese
    Then I should land on the Portuguese case study "Otimizando o pipeline de testes Cypress"
