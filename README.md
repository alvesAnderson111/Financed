# Alysson

Aplicação web responsiva para controle diário de ganhos e despesas.

## MVP atual

- Calendário com os 12 meses do ano.
- Ano atual sincronizado com a data do aparelho.
- Acesso a uma planilha diária ao clicar no mês.
- Entrada somente de **ganho total** e **despesa total** por dia.
- **Lucro líquido diário = ganho total - despesa total**.
- Total líquido mensal calculado automaticamente a partir de todos os dias.
- Clique no total líquido mensal para abrir um pop-up com ganho bruto, gasto bruto e lucro líquido.
- Salvamento local no dispositivo com `localStorage`.
- Layout responsivo para desktop, teclado/mouse e telas touch.
- Estrutura de PWA para instalação e uso offline após o primeiro carregamento.

## Observação contábil

Com apenas os campos de ganho e despesa, o aplicativo calcula corretamente o **lucro líquido** como receita menos despesas informadas. Um **lucro bruto contábil separado** exigiria pelo menos a distinção entre custos diretos e demais despesas; essa etapa pode ser adicionada depois sem quebrar a estrutura atual.

## Estrutura

- `index.html` — interface.
- `styles.css` — layout responsivo.
- `app.js` — cálculos, calendário e persistência local.
- `manifest.json` — configuração PWA.
- `sw.js` — cache para uso offline.

## Como testar

Abra `index.html` em um servidor local ou publique o conteúdo em GitHub Pages.
