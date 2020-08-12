-- -------------------------------------
-- SEACH PAGE QUERIES
-- -------------------------------------
-- select all titles from movie and shows
SELECT title FROM Movies UNION SELECT title FROM Shows ORDER BY title;
-- Search for Movie
SELECT movieID FROM Movies WHERE title=:user_entered_title_from_search_page
SELECT streamingServiceID FROM StreamingService_Movies WHERE movieID=(SELECT movieID FROM Movies WHERE title=:user_entered_title_from_search_page)
SELECT score FROM IMDB WHERE title=:user_entered_title_from_search_page
-- SELECT score AS imdb_score, Movies.title AS title, group_concat(name) AS streaming_service
-- FROM Movies
-- INNER JOIN StreamingService_Movies ON StreamingService_Movies.movieID=Movies.movieID
-- INNER JOIN StreamingServices ON StreamingServices.streamingServiceID=StreamingService_Movies.streamingServiceID
-- INNER JOIN IMDB ON IMDB.imdbID=Movies.imdbID
-- WHERE Movies.title= :user_entered_title_from_search_page
-- GROUP BY Movies.title;
-- Search for Shows
SELECT score FROM IMDB WHERE title=:user_entered_title_from_search_page
SELECT showID FROM Shows WHERE title=:user_entered_title_from_search_page
SELECT streamingServiceID FROM StreamingService_Shows WHERE showID=(SELECT showID FROM Shows WHERE title=:user_entered_title_from_search_page)
-- SELECT score AS imdb_score, Shows.title AS title, group_concat(name) AS streaming_service
-- FROM Shows
-- INNER JOIN StreamingService_Shows ON StreamingService_Shows.showID=Shows.showID
-- INNER JOIN StreamingServices ON StreamingServices.streamingServiceID=StreamingService_Shows.streamingServiceID
-- INNER JOIN IMDB ON IMDB.imdbID=Shows.imdbID
-- WHERE Shows.title= :user_entered_title_from_search_page
-- GROUP BY Shows.title;
-- Saving a Search result
INSERT INTO Search_List_Showie_Movie (score, title, netflix, hulu, prime. disney) VALUES (:score_from_user_search_results, :title_from_user_search_results, :netflix_from_user_search_results, :hulu_from_user_search_results, :prime_from_user_search_results, :disney_from_user_search_results);

-- -------------------------------------
-- SAVED PAGE QUERIES
-- -------------------------------------
-- Selecting all saved entries
SELECT * FROM Search_List_Showie_Movie
-- Deleting saved shows/movies
DELETE FROM Search_List_Showie_Movie WHERE id=:Search_List_Showie_Movie.id_from_saved_page;

-- -------------------------------------
-- EDIT PAGE QUERIES
-- -------------------------------------
-- Get the streaming service ids
SELECT streamingServiceID FROM StreamingService_Movies WHERE movieID=:from_ edit_page_form_hidden_value
-- Select all streaming services
SELECT * FROM StreamingServices
--  gets all movie data if title is a match
SELECT * FROM Movies WHERE title=:user_entered_title_from_edit_page
-- Select all titles for shows and movies
SELECT title FROM Movies UNION SELECT title FROM Shows ORDER BY title;
-- Search for Movie
-- SELECT title from Movies as M from Shows join
-- SELECT score AS imdb_score, Movies.title AS title, group_concat(name) AS streaming_service
-- FROM Movies
-- INNER JOIN StreamingService_Movies ON StreamingService_Movies.movieID=Movies.movieID
-- INNER JOIN StreamingServices ON StreamingServices.streamingServiceID=StreamingService_Movies.streamingServiceID
-- INNER JOIN IMDB ON IMDB.imdbID=Movies.imdbID
-- WHERE Movies.title= :user_entered_title_from_search_page
-- GROUP BY Movies.title;
-- Search for Shows
SELECT score AS imdb_score, Shows.title AS title, group_concat(name) AS streaming_service
FROM shows
INNER JOIN StreamingService_Shows ON StreamingService_Shows.showID=Shows.showID
INNER JOIN StreamingServices ON StreamingServices.streamingServiceID=StreamingService_Shows.streamingServiceID
INNER JOIN IMDB ON IMDB.imdbID=Shows.imdbID
WHERE Shows.title= :user_entered_title_from_search_page
GROUP BY Shows.title;
-- Edit the values
UPDATE Movies SET title=:edit_page_title_value WHERE title=title;
UPDATE IMDB SET score=:edit_page_score_value WHERE imdbID=(SELECT imdbID FROM Movies WHERE title=:edit_page_title_value);
-- If adding a streaming service to a movie
INSERT INTO StreamingService_Movies (movieID, streamingServiceID) VALUES ((SELECT movieID FROM Movies WHERE title=:edit_page_title_value),(:edit_page_streaming_service_value));
-- If removing a streaming service from a movie
DELETE FROM StreamingService_Movies WHERE movieID=(SELECT movieID FROM Movies WHERE title=:edit_page_title_value) AND streamingServiceID=:edit_page_streaming_service_value;

UPDATE Shows SET title=:edit_page_title_value WHERE title=title;
UPDATE IMDB SET score=:edit_page_score_value WHERE imdbID=(SELECT imdbID FROM Shows WHERE title=:edit_page_title_value);
-- If adding a streaming service to a show
INSERT INTO StreamingService_Shows (showID, streamingServiceID) VALUES ((SELECT showID FROM Shows WHERE title=:edit_page_title_value),(:edit_page_streaming_service_value));
-- If removing a streaming service from a show
DELETE FROM StreamingService_Shows WHERE showID=(SELECT showID FROM Shows WHERE title=:edit_page_title_value) AND streamingServiceID=:edit_page_streaming_service_value;

-- -------------------------------------
-- ADD PAGE QUERIES
-- -------------------------------------
SELECT movieID FROM Movies WHERE title=:title_from_user_add_page
SELECT imdbID FROM IMDB WHERE title=:title_from_user_add_page
-- Adding to the IMDB table
INSERT INTO IMDB (title, score) VALUES (:title_from_user_add_page, :score_from_user_add_page);
--  Adding to the Movies table
INSERT INTO Movies (title, imdbID) VALUES (:title_from_user_add_page, (SELECT imdbID FROM IMDB WHERE title=:title_from_user_add_page));
-- Adding to the Shows table
INSERT INTO Shows (title, imdbID) VALUES (:title_from_user_add_page, (SELECT imdbID FROM IMDB WHERE title=:title_from_user_add_page));
-- JS for loop to add each streaming service relationship
INSERT INTO StreamingService_Movies (movieID, streamingServiceID) VALUES ((SELECT movieID FROM Movies WHERE title=:title_from_user_add_page), :streaming_service_from_add_page);
-- Adding to the StreamingServices table
INSERT INTO StreamingServices (name) VALUES (:user_entered_name_from_add_page)
