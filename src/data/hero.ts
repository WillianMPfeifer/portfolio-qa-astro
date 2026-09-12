export interface HeroContent {
  scenarioTitle: string;
  given: string;
  when: string;
  then: string;
  prose: string;
}

export const hero: Record<'en' | 'pt', HeroContent> = {
  en: {
    scenarioTitle: 'a team that already automates needs backup',
    given:
      'a year and a half leading quality, manual testing and Cypress automation across three modules, and a two-person team',
    when: 'a team already has an automation process and needs someone who understands the client and adjusts whatever needs adjusting',
    then: 'that guy is me',
    prose:
      "Tests, an AI can write. Understanding the team and the client, adjusting for them, and bringing the right tool at the right time — that, it can't.",
  },
  pt: {
    scenarioTitle: 'time que já automatiza busca reforço',
    given:
      'um ano e meio à frente da qualidade, manual e Cypress em três módulos, e um time de duas pessoas',
    when: 'um time já tem processo de automação e precisa de alguém que entenda o cliente e ajuste o que for preciso',
    then: 'esse cara sou eu',
    prose:
      'Testes uma IA escreve. Entender o time e o cliente, ajustar pra eles, e trazer a ferramenta certa na hora certa — isso não.',
  },
};
