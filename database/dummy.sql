--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1 (Debian 16.1-1.pgdg120+1)
-- Dumped by pg_dump version 16.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: block; Type: TABLE DATA; Schema: public; Owner: jiyun
--

INSERT INTO public.block (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (3, '2023-12-02 03:40:56.562334+00', '2023-12-02 03:40:56.562334+00', NULL, 1, 5);
INSERT INTO public.block (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (4, '2023-12-02 03:41:24.847254+00', '2023-12-02 03:41:24.847254+00', NULL, 1, 4);
INSERT INTO public.block (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (5, '2023-12-02 03:42:07.892276+00', '2023-12-02 03:42:07.892276+00', NULL, 4, 5);
INSERT INTO public.block (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (6, '2023-12-02 03:42:07.892276+00', '2023-12-02 03:42:07.892276+00', NULL, 5, 3);
INSERT INTO public.block (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (7, '2023-12-02 03:42:07.892276+00', '2023-12-02 03:42:07.892276+00', NULL, 5, 2);


--
-- Data for Name: channel; Type: TABLE DATA; Schema: public; Owner: jiyun
--

INSERT INTO public.channel (id, "createdAt", "updatedAt", "deletedAt", name, "channelType", password, "ownerId") VALUES (1, '2023-12-02 03:20:33.185711+00', '2023-12-02 03:20:33.185711+00', NULL, 'publicch1', 'PUBLIC', NULL, 5);
INSERT INTO public.channel (id, "createdAt", "updatedAt", "deletedAt", name, "channelType", password, "ownerId") VALUES (2, '2023-12-02 05:12:25.658717+00', '2023-12-02 05:12:25.658717+00', NULL, 'protected', 'PROTECTED', '$2b$10$CCF.sHJSpvI79KR3UNus2eC4U2izenVra3c7KjnGA2UFKxwjt.ZCy', 1);
INSERT INTO public.channel (id, "createdAt", "updatedAt", "deletedAt", name, "channelType", password, "ownerId") VALUES (3, '2023-12-02 05:28:14.898349+00', '2023-12-02 05:28:14.898349+00', NULL, '상예키와디엠', 'DM', NULL, 4);
INSERT INTO public.channel (id, "createdAt", "updatedAt", "deletedAt", name, "channelType", password, "ownerId") VALUES (4, '2023-12-02 06:28:49.86125+00', '2023-12-02 06:28:49.86125+00', NULL, '윱최와디엠', 'DM', NULL, 4);


--
-- Data for Name: channel_invitation; Type: TABLE DATA; Schema: public; Owner: jiyun
--



--
-- Data for Name: channel_user; Type: TABLE DATA; Schema: public; Owner: jiyun
--

INSERT INTO public.channel_user (id, "createdAt", "updatedAt", "deletedAt", "channelId", "userId", "channelUserType", "isBanned") VALUES (1, '2023-12-02 03:20:33.188742+00', '2023-12-02 03:20:33.188742+00', NULL, 1, 5, 'OWNER', false);
INSERT INTO public.channel_user (id, "createdAt", "updatedAt", "deletedAt", "channelId", "userId", "channelUserType", "isBanned") VALUES (2, '2023-12-02 05:12:25.735678+00', '2023-12-02 05:12:25.735678+00', NULL, 2, 1, 'OWNER', false);
INSERT INTO public.channel_user (id, "createdAt", "updatedAt", "deletedAt", "channelId", "userId", "channelUserType", "isBanned") VALUES (3, '2023-12-02 05:21:25.24349+00', '2023-12-02 05:21:25.24349+00', NULL, 2, 2, 'MEMBER', false);
INSERT INTO public.channel_user (id, "createdAt", "updatedAt", "deletedAt", "channelId", "userId", "channelUserType", "isBanned") VALUES (4, '2023-12-02 05:26:15.969314+00', '2023-12-02 05:26:15.969314+00', NULL, 1, 4, 'MEMBER', false);
INSERT INTO public.channel_user (id, "createdAt", "updatedAt", "deletedAt", "channelId", "userId", "channelUserType", "isBanned") VALUES (5, '2023-12-02 05:28:14.909283+00', '2023-12-02 05:28:14.909283+00', NULL, 3, 4, 'OWNER', false);
INSERT INTO public.channel_user (id, "createdAt", "updatedAt", "deletedAt", "channelId", "userId", "channelUserType", "isBanned") VALUES (6, '2023-12-02 05:28:14.915778+00', '2023-12-02 05:28:14.915778+00', NULL, 3, 5, 'MEMBER', false);
INSERT INTO public.channel_user (id, "createdAt", "updatedAt", "deletedAt", "channelId", "userId", "channelUserType", "isBanned") VALUES (7, '2023-12-02 06:28:49.869352+00', '2023-12-02 06:28:49.869352+00', NULL, 4, 4, 'OWNER', false);
INSERT INTO public.channel_user (id, "createdAt", "updatedAt", "deletedAt", "channelId", "userId", "channelUserType", "isBanned") VALUES (8, '2023-12-02 06:28:49.87205+00', '2023-12-02 06:28:49.87205+00', NULL, 4, 1, 'MEMBER', false);


--
-- Data for Name: friend; Type: TABLE DATA; Schema: public; Owner: jiyun
--

INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (1, '2023-12-02 03:32:51.689156+00', '2023-12-02 03:32:51.689156+00', NULL, 1, 2);
INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (2, '2023-12-02 03:32:53.608714+00', '2023-12-02 03:32:53.608714+00', NULL, 1, 3);
INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (3, '2023-12-02 03:34:06.264301+00', '2023-12-02 03:34:06.264301+00', NULL, 2, 1);
INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (4, '2023-12-02 03:34:06.264301+00', '2023-12-02 03:34:06.264301+00', NULL, 3, 4);
INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (5, '2023-12-02 03:34:06.264301+00', '2023-12-02 03:34:06.264301+00', NULL, 3, 1);
INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (6, '2023-12-02 03:34:06.264301+00', '2023-12-02 03:34:06.264301+00', NULL, 3, 2);
INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (7, '2023-12-02 03:34:06.264301+00', '2023-12-02 03:34:06.264301+00', NULL, 4, 1);
INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (8, '2023-12-02 03:34:06.264301+00', '2023-12-02 03:34:06.264301+00', NULL, 4, 2);
INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (9, '2023-12-02 03:34:06.264301+00', '2023-12-02 03:34:06.264301+00', NULL, 4, 3);
INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (11, '2023-12-02 03:34:06.264301+00', '2023-12-02 03:34:06.264301+00', NULL, 5, 1);
INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (12, '2023-12-02 03:34:06.264301+00', '2023-12-02 03:34:06.264301+00', NULL, 5, 2);
INSERT INTO public.friend (id, "createdAt", "updatedAt", "deletedAt", "fromUserId", "toUserId") VALUES (15, '2023-12-02 03:34:53.698951+00', '2023-12-02 03:40:56.559489+00', '2023-12-02 03:40:56.559489+00', 1, 5);


--
-- Data for Name: game; Type: TABLE DATA; Schema: public; Owner: jiyun
--



--
-- Data for Name: game_invitation; Type: TABLE DATA; Schema: public; Owner: jiyun
--



--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: jiyun
--

INSERT INTO public."user" (id, "createdAt", "updatedAt", "deletedAt", nickname, avatar, email, "isMfaEnabled", "ladderScore", "ladderMaxScore", "winCount", "loseCount", "refreshToken", "gameSocketId", "channelSocketId", "statusMessage", status) VALUES (1, '2023-12-02 03:19:34.302102+00', '2023-12-02 08:34:39.769368+00', NULL, 'yubchoi', NULL, 'yubchoi@student.42seoul.kr', false, 1200, 1200, 0, 0, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzAxNDk0NjIwLCJleHAiOjE3MDIwOTk0MjB9.oKRM-lR_0G1oB6rFt8UslxwVjaYxNP7kotXgNdqks_g', NULL, NULL, NULL, 'OFFLINE');
INSERT INTO public."user" (id, "createdAt", "updatedAt", "deletedAt", nickname, avatar, email, "isMfaEnabled", "ladderScore", "ladderMaxScore", "winCount", "loseCount", "refreshToken", "gameSocketId", "channelSocketId", "statusMessage", status) VALUES (2, '2023-12-02 03:19:48.160854+00', '2023-12-02 08:34:39.769368+00', NULL, 'jiyun', NULL, 'jiyun@student.42seoul.kr', false, 1200, 1200, 0, 0, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzAxNDk0NjIzLCJleHAiOjE3MDIwOTk0MjN9.Q6YigxUyghkzZZWLVnJmXN6nvdY8HPi1aLqGcrH1Qos', NULL, NULL, NULL, 'OFFLINE');
INSERT INTO public."user" (id, "createdAt", "updatedAt", "deletedAt", nickname, avatar, email, "isMfaEnabled", "ladderScore", "ladderMaxScore", "winCount", "loseCount", "refreshToken", "gameSocketId", "channelSocketId", "statusMessage", status) VALUES (5, '2023-12-02 03:20:03.833044+00', '2023-12-02 08:34:39.769368+00', NULL, 'sangyeki', NULL, 'sangyeki@student.42seoul.kr', false, 1200, 1200, 0, 0, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiaWF0IjoxNzAxNDk0NjMzLCJleHAiOjE3MDIwOTk0MzN9.vRz9CsHVydWjeIa6Lne7SECZuDOztadWVBugepxYpIQ', NULL, NULL, NULL, 'OFFLINE');
INSERT INTO public."user" (id, "createdAt", "updatedAt", "deletedAt", nickname, avatar, email, "isMfaEnabled", "ladderScore", "ladderMaxScore", "winCount", "loseCount", "refreshToken", "gameSocketId", "channelSocketId", "statusMessage", status) VALUES (3, '2023-12-02 03:19:53.482907+00', '2023-12-02 08:34:39.769368+00', NULL, 'jang-cho', NULL, 'jang-cho@student.42seoul.kr', false, 1200, 1200, 0, 0, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzAxNDk0NjM5LCJleHAiOjE3MDIwOTk0Mzl9._d_WJ7XL8l8vdZFOlb7lCc4MRQkVREZm0eqEYtawM_E', NULL, NULL, NULL, 'OFFLINE');
INSERT INTO public."user" (id, "createdAt", "updatedAt", "deletedAt", nickname, avatar, email, "isMfaEnabled", "ladderScore", "ladderMaxScore", "winCount", "loseCount", "refreshToken", "gameSocketId", "channelSocketId", "statusMessage", status) VALUES (4, '2023-12-02 03:19:59.864485+00', '2023-12-02 08:34:41.718081+00', NULL, 'him', NULL, 'him@student.42seoul.kr', false, 1200, 1200, 0, 0, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiaWF0IjoxNzAxNDk0NzY4LCJleHAiOjE3MDIwOTk1Njh9.nNd3mlwIO4BORIM8fbn4PtnpAs84rr9WM_rU-Ee8Sk0', NULL, NULL, NULL, 'OFFLINE');


--
-- Name: block_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jiyun
--

SELECT pg_catalog.setval('public.block_id_seq', 7, true);


--
-- Name: channel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jiyun
--

SELECT pg_catalog.setval('public.channel_id_seq', 4, true);


--
-- Name: channel_invitation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jiyun
--

SELECT pg_catalog.setval('public.channel_invitation_id_seq', 1, false);


--
-- Name: channel_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jiyun
--

SELECT pg_catalog.setval('public.channel_user_id_seq', 8, true);


--
-- Name: friend_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jiyun
--

SELECT pg_catalog.setval('public.friend_id_seq', 15, true);


--
-- Name: game_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jiyun
--

SELECT pg_catalog.setval('public.game_id_seq', 1, false);


--
-- Name: game_invitation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jiyun
--

SELECT pg_catalog.setval('public.game_invitation_id_seq', 1, false);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jiyun
--

SELECT pg_catalog.setval('public.user_id_seq', 5, true);


--
-- PostgreSQL database dump complete
--

