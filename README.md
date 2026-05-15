# GeoTrack - Gestão de Frota Inteligente

O **GeoTrack** é uma solução completa destinada à resolução de um desafio referente ao processo seletivo do ISI-SENAI.

## Como Rodar o Projeto

O projeto é totalmente conteinerizado com **Docker**. Certifique-se de ter o Docker e o Docker Compose instalados na sua máquina. Você pode baixar o instalador neste link: https://www.docker.com/products/docker-desktop/

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/larissa-vitoria/geotrack.git](https://github.com/larissa-vitoria/geotrack.git)
    cd geotrack
    ```
2.  **Configure o Ambiente:**
    * Renomeie o arquivo `.env.example` para `.env`.
    * O sistema já vem configurado com credenciais seguras para desenvolvimento local no .env.example. Basta renomear o arquivo para .env para que o Docker e o Django se comuniquem automaticamente.
3.  **Suba os Containers:**
    ```bash
    docker-compose up -d --build
    ```
4.  **Popule o Banco de Dados (Seed):**
    ```bash
    docker exec -it geotrack_backend python manage.py seed_carros
    ```
5.  **Acesse as Interfaces:**
    * **Frontend (Dashboard):** [http://localhost:5173](http://localhost:5173)
    * **API Documentation (Swagger):** [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

---

## Variáveis de Ambiente (.env)

| Variável | Descrição | Valor Padrão |
| :--- | :--- | :--- |
| `POSTGRES_DB` | Nome do banco PostGIS | `geotrack_db` |
| `POSTGRES_USER` | Usuário do banco | `larissa` |
| `POSTGRES_PASSWORD` | Senha do banco | `password` |
| `POSTGRES_HOST` | Nome do serviço do banco no Docker | `db` |
| `POSTGRES_PORT` | Porta de conexão do PostgreSQL | `5432` |
| `UPDATE_INTERVAL` | Frequência de atualização do simulador (segundos) | `20` |
| `DEBUG` | Modo de depuração do Django | `True` |
| `SECRET_KEY` | Chave mestra de segurança do Django | `sua_chave_secreta_aqui` |

---

## Tecnologias e Decisões Técnicas

### **Backend: Django & PostGIS**
* **Por que PostGIS?** Diferente de bancos relacionais comuns, o PostGIS permite cálculos de distância e interseção geográfica diretamente via SQL, garantindo performance superior em consultas de raio.
* **Por que separar em classes:** Isso desacopla a regra de negócio da infraestrutura. Se amanhã mudarmos do Open-Meteo para o AccuWeather, basta alterar uma classe sem tocar no restante do sistema.
* **DRF & Spectacular:** Utilizado para criar uma API robusta com documentação automática seguindo o padrão OpenAPI 3.0, facilitando a integração com o frontend e testes manuais.
* **Arquitetura de Micro-serviços**: O simulador foi separado em um processo de background isolado (Worker Pattern). Isso garante que o processamento pesado de cálculos geográficos e chamadas de API externas não onere a thread principal da API REST, mantendo o sistema responsivo mesmo com o aumento da frota.

### **Resiliência: Circuit Breaker Pattern**
* **Por que implementar?** Implementei um **Circuit Breaker** manual que interrompe as requisições após 3 falhas consecutivas, protegendo o sistema de travamentos por timeout e garantindo que o cadastro de veículos e a simulação continuem funcionando mesmo com o serviço de clima offline. A implementação do Circuit Breaker foi feita de forma estatística (usando atributos de classe).

### **Frontend: React, Leaflet & Recharts**
* **Visualização:** O Leaflet foi escolhido pela leveza e suporte nativo a mapas interativos.
* **Dashboard:** O Recharts processa os dados da API para gerar indicadores visuais de saúde da frota, permitindo uma visão executiva rápida sobre veículos ativos vs. com problemas.

---

## O que foi implementado

* **CRUD Completo:** Gerenciamento de veículos com validação de placa (padrão 7 caracteres) e modelo.
* **Busca Geográfica Avançada:** Filtro por latitude, longitude e raio dinâmico via mapa ou formulário.
* **Simulador de Movimento:** Worker assíncrono que move os carros dentro dos limites de SC e atualiza o clima em tempo real.
* **Filtros Inteligentes:** Sincronização entre filtros de status no mapa, KPIs e na listagem em tabela.
* **Testes Automatizados:** Cobertura de testes para filtros geográficos do PostGIS e comportamento do Circuit Breaker.

---

## O que ficou de fora (Justificativa)

1.  **Gráficos de Séries Temporais:**
    * *Justificativa:* Como o foco foi o monitoramento em tempo real, gráficos de linha históricos foram suprimidos em favor de gráficos de pizza/barra que mostram a saúde imediata da frota.

---

## Testes

Para validar a integridade do sistema e o Circuit Breaker, rode:
```bash
docker exec -it geotrack_backend python manage.py test fleet

Desenvolvido por Larissa – 2026.