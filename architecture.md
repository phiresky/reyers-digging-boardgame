The game runs entirely in the browser, optimized for mobile devices.
The server is required to verify rules, run random events and transfer data between users.

One instance of a game consists of a series of events. Events are system-events and user-events.

Each move is sent to the server, which queues it, applies it, and transfers it to all players.

The game can easily at any time be recreated from scratch by applying all previous moves.

# Event public/private

Each event has a private portion and public portion. The private portion is not sent to clients, but stored in the DB for

Each event is immutable once applied.

# DB

`game_table (id, created, join_token)`

`game_events (game_table_id, sequence integer, event json)`

# Req Flow

1. create_table (player name, session_secret, config) -> {tableId: string, }
2. join_table (player name, session_secret, table_id) -> ok / not ok
3. start_game (session_secret)
