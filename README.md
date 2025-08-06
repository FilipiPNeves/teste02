# hctabot

Bot WhatsApp usando Baileys, pronto para deploy no Railway.

## Rodando localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o bot:
   ```bash
   npm start
   ```

## Deploy no Railway

1. Faça fork ou clone deste repositório.
2. No Railway, conecte seu GitHub e selecione este projeto.
3. Configure as variáveis de ambiente necessárias (se houver).
4. O Railway irá rodar `npm install` e `npm start` automaticamente.

## Observações
- Não suba arquivos da pasta `auth_info_baileys` nem arquivos sensíveis.
- Use um arquivo `.env` para variáveis secretas e não suba ele para o repositório.