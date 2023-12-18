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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: block; Type: TABLE; Schema: public; Owner: jiyun
--

CREATE TABLE IF NOT EXISTS public.block (
    id integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp with time zone,
    "fromUserId" integer NOT NULL,
    "toUserId" integer NOT NULL
);


ALTER TABLE public.block OWNER TO jiyun;

--
-- Name: block_id_seq; Type: SEQUENCE; Schema: public; Owner: jiyun
--

CREATE SEQUENCE IF NOT EXISTS public.block_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.block_id_seq OWNER TO jiyun;

--
-- Name: block_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jiyun
--

ALTER SEQUENCE public.block_id_seq OWNED BY public.block.id;


--
-- Name: channel; Type: TABLE; Schema: public; Owner: jiyun
--

CREATE TABLE IF NOT EXISTS public.channel (
    id integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp with time zone,
    name character varying,
    "channelType" character varying NOT NULL,
    password character varying,
    "ownerId" integer
);


ALTER TABLE public.channel OWNER TO jiyun;

--
-- Name: channel_id_seq; Type: SEQUENCE; Schema: public; Owner: jiyun
--

CREATE SEQUENCE IF NOT EXISTS public.channel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.channel_id_seq OWNER TO jiyun;

--
-- Name: channel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jiyun
--

ALTER SEQUENCE public.channel_id_seq OWNED BY public.channel.id;


--
-- Name: channel_invitation; Type: TABLE; Schema: public; Owner: jiyun
--

CREATE TABLE IF NOT EXISTS public.channel_invitation (
    id integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp with time zone,
    "channelId" integer NOT NULL,
    "invitingUserId" integer NOT NULL,
    "invitedUserId" integer NOT NULL
);


ALTER TABLE public.channel_invitation OWNER TO jiyun;

--
-- Name: channel_invitation_id_seq; Type: SEQUENCE; Schema: public; Owner: jiyun
--

CREATE SEQUENCE IF NOT EXISTS public.channel_invitation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.channel_invitation_id_seq OWNER TO jiyun;

--
-- Name: channel_invitation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jiyun
--

ALTER SEQUENCE public.channel_invitation_id_seq OWNED BY public.channel_invitation.id;


--
-- Name: channel_user; Type: TABLE; Schema: public; Owner: jiyun
--

CREATE TABLE IF NOT EXISTS public.channel_user (
    id integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp with time zone,
    "channelId" integer NOT NULL,
    "userId" integer NOT NULL,
    "channelUserType" character varying DEFAULT 'MEMBER'::character varying NOT NULL,
    "isBanned" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.channel_user OWNER TO jiyun;

--
-- Name: channel_user_id_seq; Type: SEQUENCE; Schema: public; Owner: jiyun
--

CREATE SEQUENCE IF NOT EXISTS public.channel_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.channel_user_id_seq OWNER TO jiyun;

--
-- Name: channel_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jiyun
--

ALTER SEQUENCE public.channel_user_id_seq OWNED BY public.channel_user.id;


--
-- Name: friend; Type: TABLE; Schema: public; Owner: jiyun
--

CREATE TABLE IF NOT EXISTS public.friend (
    id integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp with time zone,
    "fromUserId" integer NOT NULL,
    "toUserId" integer NOT NULL
);


ALTER TABLE public.friend OWNER TO jiyun;

--
-- Name: friend_id_seq; Type: SEQUENCE; Schema: public; Owner: jiyun
--

CREATE SEQUENCE IF NOT EXISTS public.friend_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.friend_id_seq OWNER TO jiyun;

--
-- Name: friend_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jiyun
--

ALTER SEQUENCE public.friend_id_seq OWNED BY public.friend.id;


--
-- Name: game; Type: TABLE; Schema: public; Owner: jiyun
--

CREATE TABLE IF NOT EXISTS public.game (
    id integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp with time zone,
    "winnerId" integer NOT NULL,
    "loserId" integer NOT NULL,
    "gameType" character varying NOT NULL,
    "winnerScore" integer NOT NULL,
    "loserScore" integer NOT NULL,
    "gameStatus" character varying NOT NULL,
    "ballSpeed" integer NOT NULL,
    "racketSize" integer NOT NULL
);


ALTER TABLE public.game OWNER TO jiyun;

--
-- Name: game_id_seq; Type: SEQUENCE; Schema: public; Owner: jiyun
--

CREATE SEQUENCE IF NOT EXISTS public.game_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.game_id_seq OWNER TO jiyun;

--
-- Name: game_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jiyun
--

ALTER SEQUENCE public.game_id_seq OWNED BY public.game.id;


--
-- Name: game_invitation; Type: TABLE; Schema: public; Owner: jiyun
--

CREATE TABLE IF NOT EXISTS public.game_invitation (
    id integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp with time zone,
    "invitingUserId" integer NOT NULL,
    "invitedUserId" integer NOT NULL,
    "gameType" character varying NOT NULL
);


ALTER TABLE public.game_invitation OWNER TO jiyun;

--
-- Name: game_invitation_id_seq; Type: SEQUENCE; Schema: public; Owner: jiyun
--

CREATE SEQUENCE IF NOT EXISTS public.game_invitation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.game_invitation_id_seq OWNER TO jiyun;

--
-- Name: game_invitation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jiyun
--

ALTER SEQUENCE public.game_invitation_id_seq OWNED BY public.game_invitation.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: jiyun
--

CREATE TABLE IF NOT EXISTS public."user" (
    id integer NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp with time zone,
    nickname character varying,
    avatar character varying,
    email character varying NOT NULL,
    "isMfaEnabled" boolean DEFAULT false NOT NULL,
    "ladderScore" integer DEFAULT 1200 NOT NULL,
    "ladderMaxScore" integer DEFAULT 1200 NOT NULL,
    "winCount" integer DEFAULT 0 NOT NULL,
    "loseCount" integer DEFAULT 0 NOT NULL,
    "refreshToken" character varying,
    "gameSocketId" character varying,
    "channelSocketId" character varying,
    "statusMessage" character varying,
    status character varying DEFAULT 'OFFLINE'::character varying NOT NULL,
    "mfaSecret" character varying
);


ALTER TABLE public."user" OWNER TO jiyun;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: jiyun
--

CREATE SEQUENCE IF NOT EXISTS public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO jiyun;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jiyun
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: block id; Type: DEFAULT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.block ALTER COLUMN id SET DEFAULT nextval('public.block_id_seq'::regclass);


--
-- Name: channel id; Type: DEFAULT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.channel ALTER COLUMN id SET DEFAULT nextval('public.channel_id_seq'::regclass);


--
-- Name: channel_invitation id; Type: DEFAULT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.channel_invitation ALTER COLUMN id SET DEFAULT nextval('public.channel_invitation_id_seq'::regclass);


--
-- Name: channel_user id; Type: DEFAULT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.channel_user ALTER COLUMN id SET DEFAULT nextval('public.channel_user_id_seq'::regclass);


--
-- Name: friend id; Type: DEFAULT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.friend ALTER COLUMN id SET DEFAULT nextval('public.friend_id_seq'::regclass);


--
-- Name: game id; Type: DEFAULT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.game ALTER COLUMN id SET DEFAULT nextval('public.game_id_seq'::regclass);


--
-- Name: game_invitation id; Type: DEFAULT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.game_invitation ALTER COLUMN id SET DEFAULT nextval('public.game_invitation_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


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

INSERT INTO public."user" (id, "createdAt", "updatedAt", "deletedAt", nickname, avatar, email, "isMfaEnabled", "ladderScore", "ladderMaxScore", "winCount", "loseCount", "refreshToken", "gameSocketId", "channelSocketId", "statusMessage", status, "mfaSecret") VALUES (2, '2023-12-02 03:19:48.160854+00', '2023-12-17 13:32:40.877455+00', NULL, 'jiyun', NULL, 'jiyun@student.42seoul.kr', false, 1200, 1200, 0, 0, '$2b$10$D8tF4ELtxQ9MOHGguWi91OQpAuEmcxUkf9LITy6Esl69RwemTX5mC', NULL, NULL, NULL, 'OFFLINE', NULL);
INSERT INTO public."user" (id, "createdAt", "updatedAt", "deletedAt", nickname, avatar, email, "isMfaEnabled", "ladderScore", "ladderMaxScore", "winCount", "loseCount", "refreshToken", "gameSocketId", "channelSocketId", "statusMessage", status, "mfaSecret") VALUES (5, '2023-12-02 03:20:03.833044+00', '2023-12-17 13:32:40.877455+00', NULL, 'sangyeki', NULL, 'sangyeki@student.42seoul.kr', false, 1200, 1200, 0, 0, '$2b$10$izrDKTQY5PSOhf8cQG3B/eZMXgYkUSOmpFQ5REuHfwjyUxhrY6H0S', NULL, NULL, NULL, 'OFFLINE', NULL);
INSERT INTO public."user" (id, "createdAt", "updatedAt", "deletedAt", nickname, avatar, email, "isMfaEnabled", "ladderScore", "ladderMaxScore", "winCount", "loseCount", "refreshToken", "gameSocketId", "channelSocketId", "statusMessage", status, "mfaSecret") VALUES (3, '2023-12-02 03:19:53.482907+00', '2023-12-17 13:32:40.877455+00', NULL, 'jang-cho', NULL, 'jang-cho@student.42seoul.kr', false, 1200, 1200, 0, 0, '$2b$10$Qjdw7pPwL8o4HeNTslTzXOswxEUmU0prpxpybk2AWcm6ZCsAgRCzG', NULL, NULL, NULL, 'OFFLINE', NULL);
INSERT INTO public."user" (id, "createdAt", "updatedAt", "deletedAt", nickname, avatar, email, "isMfaEnabled", "ladderScore", "ladderMaxScore", "winCount", "loseCount", "refreshToken", "gameSocketId", "channelSocketId", "statusMessage", status, "mfaSecret") VALUES (4, '2023-12-02 03:19:59.864485+00', '2023-12-17 13:32:40.877455+00', NULL, 'him', NULL, 'him@student.42seoul.kr', false, 1200, 1200, 0, 0, '$2b$10$3GZbxg4I1INf8fh/6I6tfOSnYXFHo8A18ExPm2olC7Xz5n6m8J11K', NULL, NULL, NULL, 'OFFLINE', NULL);
INSERT INTO public."user" (id, "createdAt", "updatedAt", "deletedAt", nickname, avatar, email, "isMfaEnabled", "ladderScore", "ladderMaxScore", "winCount", "loseCount", "refreshToken", "gameSocketId", "channelSocketId", "statusMessage", status, "mfaSecret") VALUES (1, '2023-12-02 03:19:34.302102+00', '2023-12-17 13:32:40.877455+00', NULL, 'yubchoi', NULL, 'yubchoi@student.42seoul.kr', false, 1200, 1200, 0, 0, '$2b$10$bGUCPliBGR8qdP00bMqznuMgjSe3lr0PyQQg.aHPL8Ww7Hz5sF75.', NULL, NULL, NULL, 'OFFLINE', NULL);


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

SELECT pg_catalog.setval('public.user_id_seq', 6, true);


--
-- Name: friend PK_1b301ac8ac5fcee876db96069b6; Type: CONSTRAINT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.friend
    ADD CONSTRAINT "PK_1b301ac8ac5fcee876db96069b6" PRIMARY KEY (id);


--
-- Name: channel_invitation PK_222ad878245e3fdca1e14e52a12; Type: CONSTRAINT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.channel_invitation
    ADD CONSTRAINT "PK_222ad878245e3fdca1e14e52a12" PRIMARY KEY (id);


--
-- Name: game PK_352a30652cd352f552fef73dec5; Type: CONSTRAINT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.game
    ADD CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY (id);


--
-- Name: channel PK_590f33ee6ee7d76437acf362e39; Type: CONSTRAINT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.channel
    ADD CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY (id);


--
-- Name: channel_user PK_7e5d4007402f6c41e35003494f8; Type: CONSTRAINT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.channel_user
    ADD CONSTRAINT "PK_7e5d4007402f6c41e35003494f8" PRIMARY KEY (id);


--
-- Name: game_invitation PK_a05ce7a2b5e34ae69053916df4d; Type: CONSTRAINT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.game_invitation
    ADD CONSTRAINT "PK_a05ce7a2b5e34ae69053916df4d" PRIMARY KEY (id);


--
-- Name: user PK_cace4a159ff9f2512dd42373760; Type: CONSTRAINT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id);


--
-- Name: block PK_d0925763efb591c2e2ffb267572; Type: CONSTRAINT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public.block
    ADD CONSTRAINT "PK_d0925763efb591c2e2ffb267572" PRIMARY KEY (id);


--
-- Name: user UQ_e2364281027b926b879fa2fa1e0; Type: CONSTRAINT; Schema: public; Owner: jiyun
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_e2364281027b926b879fa2fa1e0" UNIQUE (nickname);


--
-- PostgreSQL database dump complete
--

