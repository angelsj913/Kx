# 네트워크 용어 완전 정리

> 이 문서는 네트워크의 기초부터 실무까지, 주요 용어를 계층별로 정리한 학습 자료입니다.
> 각 용어마다 **개념 설명 → 명령어/예시 → 연습 문제** 순서로 구성되어 있습니다.

---

## 목차

1. [기초 개념](#1-기초-개념)
2. [OSI 7계층 / TCP-IP 4계층](#2-osi-7계층--tcp-ip-4계층)
3. [물리 계층 (L1)](#3-물리-계층-l1)
4. [데이터 링크 계층 (L2)](#4-데이터-링크-계층-l2)
5. [네트워크 계층 (L3)](#5-네트워크-계층-l3)
6. [전송 계층 (L4)](#6-전송-계층-l4)
7. [응용 계층 (L7)](#7-응용-계층-l7)
8. [무선 네트워크](#8-무선-네트워크)
9. [보안](#9-보안)
10. [VPN / 터널링](#10-vpn--터널링)
11. [클라우드 네트워크](#11-클라우드-네트워크)
12. [진단 명령어 모음](#12-진단-명령어-모음)
13. [연습 문제](#13-연습-문제)
14. [테더링 감지 우회 심화](#14-테더링-감지-우회-심화)
15. [ADB (Android Debug Bridge) 완전 가이드](#15-adb-android-debug-bridge-완전-가이드)
16. [스마트폰 잠금 해제 — 비공식 방법](#16-스마트폰-잠금-해제--비공식-방법)

---

## 1. 기초 개념

### 패킷 (Packet)
네트워크에서 데이터를 전송하는 **최소 단위**. 큰 데이터를 잘게 쪼개서 각각 헤더(주소 정보)를 붙여 보내고, 도착지에서 다시 조립한다.

```
[헤더: 출발지 IP, 도착지 IP, TTL 등] + [페이로드: 실제 데이터]
```

비유: 택배 상자. 큰 가구를 한 번에 못 보내니까 부품별로 나눠서 각 상자에 주소 라벨(헤더)을 붙여 보내는 것.

### 프로토콜 (Protocol)
두 장치가 통신할 때 지켜야 할 **약속/규칙**. "어떤 형식으로, 어떤 순서로, 어떤 속도로 데이터를 주고받을 것인가"를 정의한다.

예시: HTTP(웹), FTP(파일 전송), SSH(원격 접속), SMTP(이메일 발송)

### 대역폭 (Bandwidth)
네트워크가 **단위 시간에 전송할 수 있는 최대 데이터량**. 보통 bps(bits per second) 단위로 표현한다.

- 100 Mbps = 초당 약 12.5 MB 전송 가능
- 1 Gbps = 초당 약 125 MB 전송 가능

### 지연 시간 / 레이턴시 (Latency)
데이터가 출발지에서 목적지까지 도달하는 데 걸리는 **시간**. ms(밀리초) 단위.

```powershell
# 지연 시간 측정
ping google.com
# 출력 예: 시간=3ms ← 이게 레이턴시
```

### 처리량 / 스루풋 (Throughput)
실제로 전송되는 데이터의 양. 대역폭이 "도로의 차선 수"라면 스루풋은 "실제 통과하는 차량 수"이다. 항상 대역폭보다 낮다 (오버헤드, 혼잡 등 때문).

### 홉 (Hop)
패킷이 출발지에서 목적지까지 가는 동안 거치는 **라우터(중계 장비) 하나하나**를 1홉이라 부른다.

```
내 PC → 공유기(1홉) → ISP 라우터(2홉) → ... → 구글 서버(N홉)
```

```powershell
# 홉 경로 추적 (Windows)
tracert google.com

# Linux/macOS
traceroute google.com
```

---

## 2. OSI 7계층 / TCP-IP 4계층

네트워크 통신을 역할별로 나눈 **표준 모델**. 실무에서는 TCP/IP 4계층을 더 많이 쓴다.

```
OSI 7계층              TCP/IP 4계층         역할                    대표 프로토콜
─────────────────────────────────────────────────────────────────────────────
7. 응용(Application)  ┐
6. 표현(Presentation) ├→ 응용 계층          사용자와 직접 상호작용    HTTP, DNS, SSH, FTP
5. 세션(Session)      ┘
4. 전송(Transport)    → 전송 계층           신뢰성, 포트 번호        TCP, UDP
3. 네트워크(Network)  → 인터넷 계층         IP 주소, 라우팅          IP, ICMP, ARP
2. 데이터링크(Link)   ┐
1. 물리(Physical)     ┘→ 네트워크 접근 계층  물리 신호, MAC 주소      Ethernet, Wi-Fi
```

핵심 원리: **캡슐화(Encapsulation)**. 데이터가 위에서 아래로 내려가면서 각 계층이 자기 헤더를 씌운다.
```
[L2 헤더][L3 헤더][L4 헤더][데이터][L2 트레일러]
  MAC      IP      포트    페이로드   검증
```

---

## 3. 물리 계층 (L1)

### 이더넷 (Ethernet)
유선 네트워크의 표준 기술. 랜선(UTP 케이블)을 통해 데이터를 전기 신호로 전송한다.

- Cat5e: 최대 1 Gbps
- Cat6: 최대 10 Gbps (짧은 거리)
- Cat6a: 최대 10 Gbps (100m)

### RJ-45
랜선 끝에 달린 **커넥터(플러그)** 규격. 8개의 금속 핀이 있다.

### 광섬유 (Fiber Optic)
전기 대신 **빛(레이저)**으로 데이터를 전송하는 케이블. 속도가 빠르고 장거리 전송에 유리하며 전자기 간섭에 강하다.

- 싱글모드(SM): 장거리 (수십 km), 가격 비쌈
- 멀티모드(MM): 단거리 (수백 m), 데이터센터 내부용

---

## 4. 데이터 링크 계층 (L2)

### MAC 주소 (Media Access Control Address)
네트워크 장치의 **물리적 고유 주소**. 제조 시 하드웨어에 고정된다. 48비트, 16진수로 표기.

```
예: A4:83:E7:2F:B1:C0
    [제조사 코드]:[장치 고유번호]
```

```powershell
# MAC 주소 확인 (Windows)
ipconfig /all
# "물리적 주소" 항목

# Linux
ip link show
```

### 스위치 (Switch)
같은 네트워크(LAN) 안에서 MAC 주소를 기반으로 **프레임(L2 패킷)**을 올바른 포트로 전달하는 장비.

허브(Hub)와의 차이: 허브는 모든 포트에 무차별 전송(브로드캐스트), 스위치는 목적지 MAC만 골라서 전송(유니캐스트).

### ARP (Address Resolution Protocol)
IP 주소를 MAC 주소로 변환하는 프로토콜. "192.168.0.5의 MAC 주소가 뭐야?"라고 네트워크 전체에 물어보는 방식.

```powershell
# ARP 테이블 확인 (Windows)
arp -a

# 출력 예:
# 인터넷 주소     물리적 주소           유형
# 192.168.0.1     a4-83-e7-2f-b1-c0     동적
```

### VLAN (Virtual LAN)
하나의 물리적 스위치를 **논리적으로 여러 네트워크로 분리**하는 기술. 같은 스위치에 꽂혀 있어도 다른 VLAN이면 통신 불가 (라우터를 거쳐야 함).

### 브로드캐스트 (Broadcast)
네트워크 내 **모든 장치**에 동시에 보내는 전송 방식.
- 브로드캐스트 주소: `FF:FF:FF:FF:FF:FF` (L2), `255.255.255.255` (L3)

### 유니캐스트 (Unicast)
**특정 한 장치**에만 보내는 전송 방식. 일반적인 1:1 통신.

### 멀티캐스트 (Multicast)
**특정 그룹의 장치들**에게만 보내는 전송 방식. IPTV, 화상회의 등에서 사용.

---

## 5. 네트워크 계층 (L3)

### IP 주소 (Internet Protocol Address)
네트워크에서 장치를 식별하는 **논리적 주소**.

#### IPv4
32비트, 점으로 구분된 4개의 숫자 (0~255).
```
예: 192.168.0.1
    10.0.0.1
    8.8.8.8 (구글 DNS)
```

#### IPv6
128비트, 콜론으로 구분된 8개의 16진수 그룹.
```
예: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
    축약: 2001:db8:85a3::8a2e:370:7334
```

### 공인 IP vs 사설 IP

| 구분 | 공인 IP (Public) | 사설 IP (Private) |
|---|---|---|
| 용도 | 인터넷에서 고유하게 식별 | 내부 네트워크에서만 사용 |
| 할당 | ISP가 부여 | 공유기/DHCP가 부여 |
| 범위 | 그 외 전부 | 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 |
| 예시 | 210.124.25.244 | 192.168.0.100 |

```powershell
# 사설 IP 확인
ipconfig

# 공인 IP 확인
curl.exe ifconfig.me
```

### 서브넷 마스크 (Subnet Mask)
IP 주소에서 **네트워크 부분과 호스트 부분을 구분**하는 값.

```
IP:          192.168.0.100
서브넷 마스크: 255.255.255.0  (= /24)

네트워크 부분: 192.168.0     ← 같은 네트워크인지 판별
호스트 부분:           .100  ← 이 네트워크 안에서의 장치 번호
```

#### CIDR 표기법
서브넷 마스크를 슬래시와 비트 수로 간결하게 표현.
```
/24 = 255.255.255.0   → 호스트 254개 가능
/16 = 255.255.0.0     → 호스트 65,534개 가능
/8  = 255.0.0.0       → 호스트 16,777,214개 가능
/32 = 255.255.255.255 → 호스트 1개 (특정 IP 하나만 지칭)
```

### ★ TTL (Time To Live)
IP 패킷 헤더에 있는 값으로, **패킷이 네트워크에서 살아있을 수 있는 최대 홉 수**. 라우터를 하나 거칠 때마다 1씩 감소하며, 0이 되면 패킷은 폐기된다.

**존재 이유**: TTL이 없으면, 잘못된 라우팅으로 패킷이 네트워크를 **영원히 빙글빙글 도는(루핑)** 상황이 발생할 수 있다. TTL은 이런 좀비 패킷을 자동으로 죽여서 네트워크를 보호한다.

**OS별 기본값**:
| OS | 기본 TTL |
|---|---|
| Windows | 128 |
| Linux / macOS | 64 |
| iOS / Android | 64 |
| 일부 라우터 | 255 |

```
예시: PC(TTL=128) → 공유기(127) → ISP(126) → ... → 서버(112)
      서버는 받은 TTL 값으로 "대략 16홉을 거쳐왔구나" 판단 가능
```

**테더링 감지 원리**:
```
아이폰 직접:     TTL=64로 출발 → 통신사 도착 시 63
PC→아이폰 경유:  TTL=128로 출발 → 아이폰에서 127 → 통신사 도착 시 126
                 (또는 64로 출발 → 63 → 62)
```
통신사는 "64에서 시작하지 않은 패킷"을 보고 테더링을 감지한다.

```powershell
# 현재 TTL 확인 (Windows)
netsh int ipv4 show global
# "기본 홉 제한" 항목

# TTL 변경
netsh int ipv4 set global defaultcurhoplimit=65

# 특정 대상까지 TTL 변화 추적
tracert -d 8.8.8.8
# 각 홉마다 TTL이 1씩 줄어드는 과정을 볼 수 있음
```

### 라우팅 (Routing)
패킷이 출발지에서 목적지까지 가는 **최적 경로를 결정**하는 과정.

### 라우터 (Router)
서로 다른 네트워크를 연결하고, 패킷의 IP 주소를 보고 **다음에 어디로 보낼지 결정**하는 장비. 가정의 공유기가 곧 라우터.

```powershell
# 라우팅 테이블 확인 (Windows)
route print

# Linux
ip route show
```

### 게이트웨이 (Gateway)
현재 네트워크에서 **외부 네트워크로 나가는 출구**. 보통 공유기의 IP 주소가 기본 게이트웨이.

```
내 PC(192.168.0.100) → 기본 게이트웨이(192.168.0.1 = 공유기) → 인터넷
```

```powershell
# 기본 게이트웨이 확인
ipconfig
# "기본 게이트웨이" 항목
```

### NAT (Network Address Translation)
사설 IP를 공인 IP로 **변환**하는 기술. 공유기가 하는 핵심 역할 중 하나.

```
내부: 192.168.0.100:54321 → [공유기/NAT] → 외부: 210.124.25.244:12345 → 인터넷
```
여러 장치가 하나의 공인 IP를 공유할 수 있게 해준다.

### ICMP (Internet Control Message Protocol)
네트워크 장비 간 **오류 메시지와 진단 정보**를 교환하는 프로토콜. `ping`과 `tracert`가 이걸 사용한다.

```powershell
# ICMP Echo Request 보내기
ping 8.8.8.8

# TTL 초과 시 ICMP "Time Exceeded" 메시지가 돌아옴 → tracert의 원리
```

### DHCP (Dynamic Host Configuration Protocol)
네트워크에 접속하는 장치에 **IP 주소를 자동으로 할당**해주는 프로토콜.

```
장치 연결 → "IP 주세요"(DISCOVER) → DHCP 서버 "이거 써"(OFFER)
         → "감사합니다"(REQUEST) → "확인"(ACK)
```

```powershell
# DHCP 재할당 (Windows)
ipconfig /release    # 현재 IP 반납
ipconfig /renew      # 새 IP 요청

# DHCP 정보 확인
ipconfig /all
# "DHCP 사용" 항목
```

### DNS (Domain Name System)
도메인 이름(예: google.com)을 IP 주소(예: 142.250.196.110)로 **변환**하는 시스템. "인터넷의 전화번호부".

```powershell
# DNS 조회 (Windows)
nslookup google.com

# 특정 DNS 서버를 지정해서 조회
nslookup google.com 8.8.8.8

# DNS 캐시 비우기
ipconfig /flushdns

# DNS 캐시 확인
ipconfig /displaydns
```

**주요 공용 DNS 서버**:
| 제공자 | 주소 |
|---|---|
| Google | 8.8.8.8, 8.8.4.4 |
| Cloudflare | 1.1.1.1, 1.0.0.1 |
| KT | 168.126.63.1 |

### IP 포워딩 (IP Forwarding)
장치가 받은 패킷을 **다른 네트워크로 전달(중계)**하는 기능. 일반 PC는 기본적으로 꺼져 있고, 라우터나 exit node 역할을 할 때 켜야 한다.

```bash
# Linux에서 확인
sysctl net.ipv4.ip_forward
# = 1 이면 켜짐, = 0 이면 꺼짐

# 켜기
sudo sysctl -w net.ipv4.ip_forward=1
```

---

## 6. 전송 계층 (L4)

### TCP (Transmission Control Protocol)
**신뢰성 있는** 데이터 전송 프로토콜. 데이터가 빠짐없이, 순서대로 도착하는 것을 보장한다.

3-Way Handshake (연결 수립):
```
클라이언트 → SYN        → 서버     "연결하고 싶어요"
클라이언트 ← SYN+ACK    ← 서버     "좋아요, 나도 준비됐어요"
클라이언트 → ACK        → 서버     "확인, 시작합시다"
```

4-Way Handshake (연결 종료):
```
클라이언트 → FIN → 서버     "끝낼게요"
클라이언트 ← ACK ← 서버     "알겠어요"
클라이언트 ← FIN ← 서버     "나도 끝낼게요"
클라이언트 → ACK → 서버     "확인"
```

### UDP (User Datagram Protocol)
**비신뢰성** 데이터 전송 프로토콜. 순서/도착 보장 없이 그냥 보낸다. 빠르다.

| 구분 | TCP | UDP |
|---|---|---|
| 신뢰성 | 보장 (재전송) | 보장 안 함 |
| 속도 | 상대적으로 느림 | 빠름 |
| 순서 | 보장 | 보장 안 함 |
| 용도 | 웹(HTTP), 이메일, 파일 전송 | 게임, 영상 스트리밍, DNS, VPN |
| 비유 | 등기 우편 | 전단지 뿌리기 |

### 포트 (Port)
하나의 IP 주소에서 **어떤 서비스/프로그램**에 데이터를 전달할지 구분하는 번호. 0~65535.

**주요 포트 번호**:
| 포트 | 프로토콜 | 용도 |
|---|---|---|
| 20, 21 | FTP | 파일 전송 |
| 22 | SSH | 원격 접속 (암호화) |
| 23 | Telnet | 원격 접속 (비암호화, 비권장) |
| 53 | DNS | 도메인 이름 해석 |
| 80 | HTTP | 웹 (비암호화) |
| 443 | HTTPS | 웹 (암호화) |
| 3306 | MySQL | 데이터베이스 |
| 3389 | RDP | 윈도우 원격 데스크톱 |
| 41641 | Tailscale | WireGuard/Tailscale 기본 포트 |

```powershell
# 현재 열린 포트 확인 (Windows)
netstat -ano

# 특정 포트가 열려있는지 테스트
Test-NetConnection google.com -Port 443

# Linux
ss -tulnp
```

### 소켓 (Socket)
**IP 주소 + 포트 번호**의 조합. 네트워크 통신의 양 끝점(endpoint)을 식별한다.
```
소켓 = 192.168.0.100:54321
       [IP 주소]   :[포트]
```

### 방화벽 (Firewall)
네트워크 트래픽을 규칙에 따라 **허용하거나 차단**하는 보안 시스템.

```powershell
# Windows 방화벽 상태 확인
netsh advfirewall show allprofiles state

# 특정 포트 열기 (Windows)
netsh advfirewall firewall add rule name="Open 41641" dir=in action=allow protocol=UDP localport=41641

# Linux (ufw)
sudo ufw status verbose
sudo ufw allow 22/tcp
sudo ufw allow 41641/udp

# Linux (iptables)
sudo iptables -L -n
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

---

## 7. 응용 계층 (L7)

### HTTP / HTTPS
웹 브라우저와 서버 간 **웹 페이지를 주고받는** 프로토콜.
- HTTP: 평문 전송 (도청 가능)
- HTTPS: TLS/SSL로 암호화 (안전)

### SSH (Secure Shell)
원격 서버에 **암호화된 연결로 접속**하는 프로토콜. 포트 22.

```bash
# 기본 접속
ssh ubuntu@100.90.163.18

# 키 인증 접속
ssh -i ~/.ssh/mykey.pem ubuntu@100.90.163.18

# 포트 포워딩 (로컬)
ssh -L 8080:localhost:80 ubuntu@서버주소
# 내 PC의 8080 포트 → 서버의 80 포트로 터널링
```

### FTP / SFTP
파일 전송 프로토콜.
- FTP: 비암호화 (비권장)
- SFTP: SSH 기반 암호화 파일 전송

### SMTP / IMAP / POP3
이메일 관련 프로토콜.
- SMTP (25/587): 이메일 **발송**
- IMAP (143/993): 이메일 **수신** (서버에 보관, 여러 기기 동기화)
- POP3 (110/995): 이메일 **수신** (다운로드 후 서버에서 삭제)

### TLS / SSL (Transport Layer Security)
통신을 **암호화**하는 프로토콜. HTTPS, SMTPS 등 "S"가 붙는 프로토콜의 기반.
- SSL: 구버전 (더 이상 사용 안 함)
- TLS 1.2 / 1.3: 현재 표준

### 프록시 (Proxy)
클라이언트와 서버 사이에서 **대리로 통신**하는 중간 서버.

- **포워드 프록시**: 클라이언트를 대리. 클라이언트의 IP를 숨길 수 있음.
- **리버스 프록시**: 서버를 대리. 로드 밸런싱, 캐시, 보안 등에 사용. (예: Nginx, Cloudflare)

### SOCKS5 프록시
TCP/UDP 레벨에서 동작하는 **범용 프록시**. HTTP 프록시보다 다양한 트래픽(게임, 토렌트 등)을 처리할 수 있다.

```
브라우저 설정 → 프록시: SOCKS5, 주소: 127.0.0.1, 포트: 1080
→ 해당 브라우저의 트래픽만 프록시 서버를 경유
```

Tailscale Exit Node와의 차이:
- SOCKS5: 앱별로 설정, 해당 앱만 우회
- Exit Node: OS 전체 트래픽이 자동으로 우회

---

## 8. 무선 네트워크

### SSID (Service Set Identifier)
Wi-Fi 네트워크의 **이름**. "iptime", "KT_GiGA_5G" 같은 것.

### 2.4 GHz vs 5 GHz

| 구분 | 2.4 GHz | 5 GHz |
|---|---|---|
| 속도 | 느림 (최대 ~600 Mbps) | 빠름 (최대 수 Gbps) |
| 범위 | 넓음 (벽 잘 통과) | 좁음 (벽에 약함) |
| 간섭 | 많음 (전자레인지, 블루투스 등) | 적음 |
| 호환성 | 모든 기기 지원 | 일부 구형 기기 미지원 |

아이폰 핫스팟의 "호환성 최대화" 옵션 = 5GHz → 2.4GHz로 전환

### WPA2 / WPA3
Wi-Fi 보안(암호화) 표준.
- WPA2: 현재 가장 보편적
- WPA3: 최신, 더 강력한 암호화
- WEP: 구형, 보안 취약 (사용 금지)

### 테더링 (Tethering)
스마트폰의 셀룰러 데이터를 다른 기기와 **공유**하는 기능.
- Wi-Fi 핫스팟: 폰이 Wi-Fi AP 역할
- USB 테더링: 케이블로 유선 연결
- 블루투스 테더링: 블루투스로 무선 연결 (느림)

### APN (Access Point Name)
모바일 기기가 통신사의 **셀룰러 네트워크에 접속할 때 사용하는 게이트웨이 이름**. 통신사별로 다르며, 일반 데이터용 APN과 테더링용 APN이 분리되어 있는 경우가 많다.

```
일반 데이터 APN: lte.sktelecom.com
테더링 APN:      tethering.sktelecom.com  (통신사가 여기서 별도 계량/차단)
```

### DPI (Deep Packet Inspection)
패킷의 헤더뿐만 아니라 **내용(페이로드)까지 검사**하는 기술. 통신사가 트래픽 유형을 식별하거나, 특정 서비스를 차단/제한할 때 사용.
- 테더링 감지 (User-Agent 헤더 확인)
- 특정 프로토콜 차단 (VPN, 토렌트 등)
- HTTPS 트래픽은 암호화되어 있어 DPI로 내용은 못 봄 (SNI는 볼 수 있음)

---

## 9. 보안

### 암호화 (Encryption)
데이터를 **읽을 수 없는 형태로 변환**하는 것.
- 대칭키: 암호화/복호화에 같은 키 사용 (AES)
- 비대칭키: 공개키로 암호화, 개인키로 복호화 (RSA, Ed25519)

### SSH 키 인증
비밀번호 대신 **공개키/개인키 쌍**으로 SSH 로그인하는 방식.

```bash
# 키 생성
ssh-keygen -t ed25519

# 서버에 공개키 등록
ssh-copy-id ubuntu@서버주소

# 서버 측 설정 (/etc/ssh/sshd_config)
PubkeyAuthentication yes        # 키 인증 허용
PasswordAuthentication no       # 비밀번호 인증 차단
PermitRootLogin no              # root 직접 로그인 차단
```

### fail2ban
SSH 무차별 대입 공격(brute-force)을 **자동으로 감지하고 차단**하는 도구.
```bash
# 상태 확인
sudo systemctl status fail2ban

# SSH jail 상태 (차단된 IP 목록)
sudo fail2ban-client status sshd
```

### 포트 스캐닝 (Port Scanning)
대상 서버의 **어떤 포트가 열려있는지 탐색**하는 행위. 보안 감사에도 쓰이고, 공격 사전 정찰에도 쓰인다.

```bash
# nmap으로 포트 스캔 (자기 서버에만 사용할 것)
nmap -sV 서버주소
```

### 공격 표면 (Attack Surface)
외부에서 접근 가능한 **모든 진입점의 합**. 열린 포트, 실행 중인 서비스, 노출된 API 등. 불필요한 서비스를 끄면 공격 표면이 줄어든다.

---

## 10. VPN / 터널링

### VPN (Virtual Private Network)
공용 인터넷 위에 **암호화된 가상의 사설 네트워크**를 만드는 기술.

### WireGuard
최신 VPN 프로토콜. 코드가 간결하고 성능이 뛰어남. Tailscale의 기반 기술.

```bash
# WireGuard 상태 확인
sudo wg show
```

### Tailscale
WireGuard 기반의 **메시 VPN** 서비스. 복잡한 설정 없이 기기들을 하나의 가상 네트워크로 묶어준다.

주요 개념:
- **Tailnet**: Tailscale이 만드는 가상 네트워크 (100.x.x.x 대역)
- **DERP 릴레이**: 직접 연결이 안 될 때 중계해주는 서버 (TCP 443)
- **Exit Node**: 다른 기기의 모든 트래픽을 자기 인터넷으로 내보내는 노드
- **Subnet Router**: 로컬 네트워크의 특정 대역을 다른 Tailscale 기기에 노출

```bash
# Tailscale 상태 확인
tailscale status

# 네트워크 진단
tailscale netcheck

# 특정 노드로 ping (직접 연결 vs DERP 확인)
tailscale ping 100.90.163.18

# Exit node로 광고
sudo tailscale up --advertise-exit-node

# Exit node 사용 (클라이언트)
tailscale set --exit-node=100.90.163.18

# Exit node 해제
tailscale set --exit-node=
```

### 터널링 (Tunneling)
한 프로토콜의 패킷을 **다른 프로토콜로 감싸서** 전송하는 기술.

```
원본 패킷: [IP 헤더][데이터]
터널링 후: [새 IP 헤더][VPN 헤더][암호화된(원본 패킷)]
```

### SSH 터널 / 포트 포워딩

```bash
# 로컬 포트 포워딩: 내 PC의 8080 → 서버를 거쳐 → 목적지의 80
ssh -L 8080:목적지:80 ubuntu@서버주소

# 동적 포트 포워딩 (SOCKS5 프록시 생성)
ssh -D 1080 ubuntu@서버주소
# 브라우저에서 SOCKS5 프록시로 127.0.0.1:1080 설정하면
# 해당 브라우저의 트래픽이 서버를 경유
```

---

## 11. 클라우드 네트워크

### VCN (Virtual Cloud Network)
오라클 클라우드에서 사용하는 **가상 네트워크**. AWS의 VPC와 같은 개념.

### VPC (Virtual Private Cloud)
AWS에서 사용하는 가상 네트워크. 서브넷, 라우팅 테이블, 보안 그룹 등을 자체적으로 가진다.

### 보안 목록 / 보안 그룹 (Security List / Security Group)
클라우드 인스턴스의 **네트워크 방화벽 규칙**. OS 방화벽과 별도로 클라우드 레벨에서 한 번 더 필터링한다.

- **Ingress 규칙**: 들어오는 트래픽 허용/차단
- **Egress 규칙**: 나가는 트래픽 허용/차단

```
예: "TCP 22번 포트, 소스 0.0.0.0/0 → 허용" = 어디서든 SSH 접속 가능
    "UDP 41641, 소스 0.0.0.0/0 → 허용" = Tailscale 직접 연결 허용
```

오라클 클라우드의 이중 방화벽 구조:
```
인터넷 → [VCN 보안 목록] → [OS 방화벽 (iptables/ufw)] → 서비스
         클라우드 레벨       서버 내부 레벨
         둘 다 통과해야 접속 가능
```

### 퍼블릭 서브넷 vs 프라이빗 서브넷
- 퍼블릭: 인터넷 게이트웨이에 연결, 공인 IP 할당 가능
- 프라이빗: 인터넷 직접 접근 불가, NAT 게이트웨이를 통해서만 외부 접속

---

## 12. 진단 명령어 모음

### Windows (PowerShell)

| 명령어 | 용도 |
|---|---|
| `ipconfig /all` | IP, MAC, DNS, 게이트웨이 전체 정보 |
| `ipconfig /release` | DHCP IP 반납 |
| `ipconfig /renew` | DHCP IP 재할당 |
| `ipconfig /flushdns` | DNS 캐시 삭제 |
| `ping 대상` | 연결 가능 여부 + 지연 시간 측정 |
| `tracert 대상` | 경로 추적 (홉별) |
| `nslookup 도메인` | DNS 조회 |
| `netstat -ano` | 열린 포트 + 연결된 프로세스 |
| `route print` | 라우팅 테이블 |
| `arp -a` | ARP 테이블 (IP↔MAC 매핑) |
| `netsh wlan show interfaces` | Wi-Fi 어댑터 상태 |
| `netsh int ipv4 show global` | IPv4 전역 설정 (TTL 등) |
| `Get-NetAdapter` | 네트워크 어댑터 목록 |
| `Test-NetConnection 대상 -Port 포트` | 특정 포트 연결 테스트 |
| `netsh winsock reset` | 네트워크 스택 초기화 (재부팅 필요) |

### Linux

| 명령어 | 용도 |
|---|---|
| `ip addr show` | IP 주소 확인 |
| `ip route show` | 라우팅 테이블 |
| `ip link show` | 네트워크 인터페이스 + MAC |
| `ss -tulnp` | 열린 포트 + 리스닝 프로세스 |
| `ping 대상` | 연결 확인 |
| `traceroute 대상` | 경로 추적 |
| `dig 도메인` | DNS 조회 (상세) |
| `curl ifconfig.me` | 공인 IP 확인 |
| `sysctl net.ipv4.ip_forward` | IP 포워딩 상태 |
| `sudo iptables -L -n` | 방화벽 규칙 |
| `sudo ufw status verbose` | ufw 방화벽 상태 |
| `sudo tcpdump -i eth0` | 실시간 패킷 캡처 |
| `mtr 대상` | ping + traceroute 통합 (실시간) |

---

## 13. 연습 문제

### 기초 개념

**문제 1.** 아래 상황에서 패킷의 TTL 값은 얼마인가?
```
Windows PC(TTL 기본값) → 공유기 → ISP 라우터 → 구글 서버
```
구글 서버가 받는 패킷의 TTL은?

<details>
<summary>정답 보기</summary>
128 - 3 = 125. Windows 기본 TTL은 128이고, 3개의 홉(공유기, ISP 라우터, 구글 서버 앞 라우터)을 거치며 각각 1씩 감소. (실제 홉 수는 더 많을 수 있음)
</details>

---

**문제 2.** `ping 8.8.8.8`은 되는데 `ping google.com`은 안 된다. 원인은?

<details>
<summary>정답 보기</summary>
DNS 문제. IP로 직접 접근은 되지만 도메인 이름을 IP로 변환하는 DNS 서버에 접근이 안 되거나, DNS 설정이 잘못된 것. `nslookup google.com 8.8.8.8`으로 확인 가능.
</details>

---

**문제 3.** TCP와 UDP 중 온라인 게임에 더 적합한 것은? 이유는?

<details>
<summary>정답 보기</summary>
UDP. 게임은 실시간성이 중요하므로, 패킷 하나가 유실되더라도 재전송을 기다리기보다 다음 프레임 데이터를 빨리 받는 게 낫다. TCP의 재전송 메커니즘은 오히려 지연(렉)을 유발한다.
</details>

---

**문제 4.** 사설 IP 주소가 아닌 것을 모두 고르시오.
```
A) 10.0.0.1
B) 172.32.0.1
C) 192.168.1.1
D) 8.8.8.8
E) 172.16.0.1
```

<details>
<summary>정답 보기</summary>
B, D.
- A: 10.0.0.0/8 범위 → 사설 IP
- B: 172.32.0.1은 172.16.0.0/12 범위(172.16~172.31) 밖 → 공인 IP
- C: 192.168.0.0/16 범위 → 사설 IP
- D: 구글 DNS → 공인 IP
- E: 172.16.0.0/12 범위 → 사설 IP
</details>

---

### 실전 응용

**문제 5.** 오라클 클라우드 서버에 SSH(22번 포트)로 접속이 안 된다. `iptables`에서 22번을 열었는데도 안 된다. 원인은?

<details>
<summary>정답 보기</summary>
오라클 클라우드는 이중 방화벽 구조. OS 방화벽(iptables)과 별도로 VCN의 Security List(보안 목록)에서도 TCP 22번 Ingress 규칙을 열어줘야 한다. 둘 중 하나라도 막혀있으면 접속 불가.
</details>

---

**문제 6.** `tailscale status`에서 상대 기기가 `relay "tok"` 로 표시된다. 이것이 의미하는 것과 해결 방법은?

<details>
<summary>정답 보기</summary>
직접 연결(Direct)이 안 되어 도쿄(tok) DERP 릴레이 서버를 경유하고 있다는 뜻. 속도가 느려진다. 해결: 양쪽 방화벽에서 UDP 41641 포트를 열어주면 직접 연결로 전환된다. 오라클 클라우드라면 OS 방화벽 + VCN Security List 모두에서 열어야 한다.
</details>

---

**문제 7.** 아이폰 핫스팟에 PC를 연결했더니 통신사가 테더링을 감지했다. 감지 원리 3가지를 설명하시오.

<details>
<summary>정답 보기</summary>
1. **TTL 값**: PC에서 출발한 패킷이 아이폰을 거치면서 TTL이 1 감소하여 아이폰 직접 발신(64)과 다른 값(63 또는 127)이 된다.
2. **HTTP User-Agent**: 암호화되지 않은 HTTP 트래픽에서 데스크톱 브라우저의 식별자가 보인다.
3. **APN 분리**: iOS가 핫스팟을 켜면 자동으로 테더링 전용 APN을 사용하여 통신사가 별도로 트래픽을 계량/차단한다.
</details>

---

**문제 8.** 아래 명령어 각각이 하는 일을 설명하시오.
```bash
sudo sysctl -w net.ipv4.ip_forward=1
sudo tailscale up --advertise-exit-node
```

<details>
<summary>정답 보기</summary>
1번: 리눅스 커널에서 IP 포워딩을 활성화한다. 이 서버가 받은 패킷을 다른 네트워크로 중계(라우팅)할 수 있게 허용하는 것.
2번: Tailscale에 이 서버를 exit node로 사용할 수 있다고 광고한다. 다른 Tailscale 기기들이 이 서버를 선택하면 모든 인터넷 트래픽이 이 서버를 거쳐 나가게 된다.
두 명령어 모두 exit node 구축에 필수. IP 포워딩 없이 exit node를 광고하면 패킷을 전달할 수 없어서 인터넷이 안 된다.
</details>

---

**문제 9.** `netsh int ipv4 set global defaultcurhoplimit=65`를 실행하는 이유는? 왜 하필 65인가?

<details>
<summary>정답 보기</summary>
테더링 감지를 우회하기 위해서. 통신사는 TTL 값으로 테더링을 감지하는데, 아이폰의 기본 TTL은 64이다. PC에서 65로 설정하면 아이폰 핫스팟을 거칠 때 1 감소하여 64가 되므로, 통신사 입장에서는 아이폰에서 직접 보낸 패킷과 구별할 수 없다. 128이나 다른 값이 아닌 65인 이유는 바로 이 "아이폰을 거치면 정확히 64가 된다"는 계산 때문.
</details>

---

**문제 10.** 서버의 SSH 설정이 아래와 같을 때, 보안상 문제점은?
```
PermitRootLogin yes
PasswordAuthentication yes
Port 22
```

<details>
<summary>정답 보기</summary>
세 가지 모두 문제:
1. `PermitRootLogin yes`: root으로 직접 SSH 접속 가능 → 공격자가 root 비밀번호만 맞추면 전체 시스템 장악
2. `PasswordAuthentication yes`: 비밀번호 인증 허용 → 무차별 대입 공격(brute-force)에 취약
3. `Port 22`: SSH 기본 포트 → 봇들이 자동으로 22번을 스캔하여 공격 시도

권장 설정:
- PermitRootLogin no
- PasswordAuthentication no (키 인증만 허용)
- Port를 비표준 포트로 변경 (예: 2222) + fail2ban 설치
</details>

---

### 종합 시나리오

**문제 11.** 다음 구성을 완성하시오: "오라클 클라우드 Ubuntu 서버를 Tailscale exit node로 만들어서, 내 Windows PC의 모든 인터넷 트래픽이 오라클 서버를 거쳐 나가게 한다."

필요한 단계를 순서대로 나열하시오.

<details>
<summary>정답 보기</summary>

**서버 측:**
1. IP 포워딩 활성화: `sysctl net.ipv4.ip_forward=1`, `net.ipv6.conf.all.forwarding=1`
2. Tailscale 설치: `curl -fsSL https://tailscale.com/install.sh | sh`
3. Exit node로 광고: `sudo tailscale up --advertise-exit-node`
4. OS 방화벽에서 UDP 41641 열기 (iptables 또는 ufw)
5. OCI 콘솔에서 VCN Security List에 UDP 41641 Ingress 규칙 추가

**관리자 콘솔:**
6. login.tailscale.com에서 해당 서버의 "Use as exit node" 승인

**클라이언트 측:**
7. Windows에 Tailscale 설치 후 로그인
8. Tailscale 트레이 → Exit Node → 오라클 서버 선택

**검증:**
9. `curl.exe ifconfig.me`로 공인 IP가 오라클 서버의 IP로 바뀌었는지 확인
10. `tailscale ping 서버IP`로 direct 연결인지 확인

</details>

---

**문제 12.** PC가 아이폰 핫스팟에 연결했으나 "인터넷 없음"이 뜬다. 원인을 순서대로 진단하는 방법을 설명하시오.

<details>
<summary>정답 보기</summary>

1. **IP 할당 확인**: `ipconfig /all` → 172.20.10.x 대역 IP를 받았는지
   - 못 받았으면: Wi-Fi 재연결, 아이폰 핫스팟 껐다 켜기
   
2. **게이트웨이(아이폰) 도달 확인**: `ping 172.20.10.1`
   - 안 되면: 5GHz 호환성 문제 → 아이폰 "호환성 최대화" 켜기
   
3. **Exit node 블랙홀 확인**: `tailscale set --exit-node=` 로 exit node 해제 후 `ping 8.8.8.8`
   - 해제 후 되면: exit node가 터널 수립 전에 트래픽을 빨아들여서 블랙홀 발생한 것
   - 터널 연결 확인(`tailscale status`) 후 다시 exit node 켜기
   
4. **인터넷 도달 확인**: `ping 8.8.8.8`
   - 안 되면: 테더링 데이터 소진/차단 → 통신사 앱에서 테더링 잔량 확인
   
5. **DNS 확인**: `nslookup google.com 8.8.8.8`
   - ping은 되는데 웹이 안 되면: DNS 문제 → `ipconfig /flushdns`
   
6. **TTL 문제 (테더링 감지)**: 
   - `netsh int ipv4 set global defaultcurhoplimit=65`로 TTL 조정 후 재시도

</details>

---

## 14. 테더링 감지 우회 심화

### 통신사의 테더링 감지 방법

통신사는 다음 3가지 방법으로 테더링을 감지한다:

| 감지 방법 | 원리 | 우회 난이도 |
|---|---|---|
| **TTL 분석** | 테더링된 기기의 패킷은 핫스팟 폰을 거치며 TTL이 1 감소하여 직접 발신과 다른 값이 됨 | 쉬움 |
| **DPI (Deep Packet Inspection)** | HTTP 헤더의 User-Agent에서 데스크톱 브라우저 식별자를 탐지 | 중간 (VPN으로 우회) |
| **APN 분리** | iOS/Android가 핫스팟을 켜면 테더링 전용 APN을 사용하여 통신사가 별도 계량/차단 | 어려움 |

### TTL을 이용한 테더링 감지 원리 (상세)

```
[정상 — 아이폰이 직접 통신]
아이폰(TTL=64) → 기지국 도착(TTL=63) ← 통신사: "정상 모바일 트래픽"

[테더링 감지 — PC가 아이폰 핫스팟 경유]
PC(TTL=128) → 아이폰(TTL=127) → 기지국 도착(TTL=126) ← 통신사: "128에서 시작했네? 테더링이다"
PC(TTL=64)  → 아이폰(TTL=63)  → 기지국 도착(TTL=62)  ← 통신사: "62? 64에서 시작해서 2홉? 테더링이다"

[TTL 우회 — PC에서 TTL을 65로 설정]
PC(TTL=65) → 아이폰(TTL=64) → 기지국 도착(TTL=63) ← 통신사: "64에서 시작한 정상 트래픽"
```

### 플랫폼별 TTL 변경 방법

#### Windows (관리자 PowerShell)

```powershell
# TTL을 65로 설정 (IPv4 + IPv6)
netsh int ipv4 set global defaultcurhoplimit=65
netsh int ipv6 set global defaultcurhoplimit=65

# 확인
netsh int ipv4 show global
# "기본 홉 제한 : 65개 홉" 이면 성공

# 되돌리기
netsh int ipv4 set global defaultcurhoplimit=128
netsh int ipv6 set global defaultcurhoplimit=128
```

- 재부팅하면 기본값(128)으로 자동 복원
- 시스템에 부작용 없음

#### Android (루팅 필요, Termux에서 실행)

**일회성 적용 (재부팅 시 초기화):**
```bash
su
iptables -t mangle -A POSTROUTING -j TTL --ttl-set 65
ip6tables -t mangle -A POSTROUTING -j HL --hl-set 65

# 확인
iptables -t mangle -L POSTROUTING -n -v
# "TTL set to 65" 규칙이 보이면 적용 완료
```

**영구 적용 (재부팅 후에도 유지, Magisk 루팅 환경):**
```bash
su
cat > /data/adb/service.d/ttl65.sh << 'EOF'
#!/system/bin/sh
sleep 30
iptables -t mangle -A POSTROUTING -j TTL --ttl-set 65
ip6tables -t mangle -A POSTROUTING -j HL --hl-set 65
EOF
chmod 755 /data/adb/service.d/ttl65.sh
```

이 스크립트는 Magisk가 매 부팅마다 자동 실행한다. Termux와는 무관 — Termux는 스크립트를 만드는 도구일 뿐이고, 실행 주체는 Magisk 데몬이다.

```
부팅 순서:
커널 로드 → 안드로이드 시스템 시작 → Magisk 데몬 시작
→ /data/adb/service.d/ttl65.sh 자동 실행 ← TTL 설정 적용
→ 홈 화면 표시
(Termux는 이 과정에 관여하지 않음)
```

**되돌리기:**
```bash
su
rm /data/adb/service.d/ttl65.sh
# 재부팅하면 TTL이 기본값(64)으로 복원
```

기존 시스템 파일을 수정하는 것이 아니라 **스크립트 파일 하나를 추가/삭제**하는 것이므로, 삭제 후 재부팅하면 완전히 원상복구된다.

#### iOS (아이폰)
탈옥(Jailbreak) 없이는 TTL 변경 불가능. iOS는 시스템 접근이 완전히 차단되어 있다.

### 루팅 (Rooting) 이란?

안드로이드 기기에서 **운영체제의 최고 관리자(root) 권한을 획득**하는 것.

```
일반 사용자  = 아파트 세입자  → 가구 배치 자유, 벽 철거 불가
루팅한 사용자 = 건물주        → 벽 철거, 배관 변경 등 모든 것 가능
```

**루팅하면 할 수 있는 것:**
- iptables로 TTL 변경
- 선탑재 앱(통신사/제조사 블로트웨어) 삭제
- 시스템 파일 직접 수정

**루팅의 리스크:**
- 보증 무효 (제조사/통신사 AS 거부 가능)
- 보안 취약 (악성 앱이 root 권한 획득 가능)
- 벽돌화 (잘못하면 부팅 불가)
- 뱅킹 앱 차단 (토스, 카카오뱅크 등 금융 앱이 루팅 감지 시 실행 거부)
- OTA 업데이트 불가

**iOS의 동일 개념:** 탈옥(Jailbreak). 원리는 같지만 iOS가 더 폐쇄적이라 난이도가 훨씬 높고, 최신 iOS는 탈옥 자체가 거의 불가능.

### 기타 우회 방법

#### VPN으로 DPI 우회 (안드로이드)
안드로이드에서 VPN을 켜고 핫스팟을 사용하면, iOS와 달리 **VPN이 테더링 트래픽도 커버하는 경우가 많다** (기기/OS 버전에 따라 다름).

```
PC → 안드로이드 핫스팟 → [VPN 터널로 암호화] → 통신사
                         통신사는 암호화된 덩어리만 보임
                         TTL, User-Agent 등 판별 불가
```

iOS는 VPN이 아이폰 자체 트래픽만 터널링하고 핫스팟 트래픽은 커버하지 않는다.

#### APN에서 dun 제거 (안드로이드)
```
설정 → 연결 → 모바일 네트워크 → 액세스 포인트 이름(APN)
→ 기존 APN 선택 → "APN 유형"에서 "dun"을 제거하고 "default,supl"만 남기기
```
`dun`은 테더링을 의미하는 APN 유형. 제거하면 통신사가 테더링 트래픽을 별도 식별하기 어려워진다. 통신사에 따라 잠겨있거나 초기화될 수 있다.

---

### 연습 문제 (추가)

**문제 13.** 안드로이드 폰에서 `iptables -t mangle -A POSTROUTING -j TTL --ttl-set 65` 명령의 각 부분이 의미하는 바를 설명하시오.

<details>
<summary>정답 보기</summary>

| 부분 | 의미 |
|---|---|
| `iptables` | 리눅스 커널의 패킷 필터링/조작 도구 |
| `-t mangle` | mangle 테이블 사용 (패킷 헤더를 수정하는 용도의 테이블) |
| `-A POSTROUTING` | POSTROUTING 체인에 규칙을 추가 (패킷이 나가기 직전에 적용) |
| `-j TTL` | TTL 타겟으로 점프 (TTL 값을 조작하겠다는 뜻) |
| `--ttl-set 65` | TTL 값을 65로 강제 설정 |

종합: "이 기기에서 나가는 모든 패킷의 TTL을 65로 강제 설정하라."
핫스팟을 거치면 1 감소하여 64가 되므로, 통신사는 직접 발신(TTL=64)과 구별할 수 없다.

</details>

---

**문제 14.** `/data/adb/service.d/ttl65.sh` 스크립트에 `sleep 30`이 있는 이유는?

<details>
<summary>정답 보기</summary>

부팅 직후에는 네트워크 인터페이스와 iptables 모듈이 아직 완전히 초기화되지 않았을 수 있다. `sleep 30`은 시스템이 충분히 부팅된 후에 iptables 규칙을 적용하기 위한 대기 시간이다. 이 대기 없이 바로 실행하면 네트워크 모듈이 준비되지 않아 규칙 적용이 실패할 수 있다.

</details>

---

**문제 15.** Windows에서 `defaultcurhoplimit=65`로 설정하는 것과 안드로이드에서 `iptables`로 TTL을 65로 설정하는 것의 차이점은?

<details>
<summary>정답 보기</summary>

| 구분 | Windows (netsh) | Android (iptables) |
|---|---|---|
| 적용 대상 | PC에서 생성되는 패킷의 초기 TTL 값 변경 | 기기를 통과하는 모든 패킷의 TTL을 강제 덮어쓰기 |
| 재부팅 후 | 기본값(128)으로 초기화 | 일회성이면 초기화, Magisk 스크립트면 유지 |
| 테더링 시 | PC 자신의 TTL만 바뀜 → 핫스팟 폰을 거치면 64가 됨 | 핫스팟으로 들어온 다른 기기의 패킷도 전부 65로 고정 → 통신사 도착 시 64 |
| 핵심 차이 | PC 쪽에서 설정하면 **핫스팟 폰(아이폰)에서는 설정 불가** → PC에서만 가능 | 안드로이드 폰에서 설정하면 **연결된 모든 기기의 TTL을 한꺼번에 처리** |

즉, 안드로이드 iptables 방식이 더 강력하다: 핫스팟에 연결된 어떤 기기든(PC, 태블릿, 다른 폰) 추가 설정 없이 TTL이 자동 조정된다.

</details>

---

## 15. ADB (Android Debug Bridge) 완전 가이드

### ADB란?

ADB(Android Debug Bridge)는 PC에서 안드로이드 기기를 **명령줄로 제어**하는 도구다. Google이 개발자용으로 만든 공식 도구이며, 앱 설치/삭제, 파일 전송, 시스템 로그 확인, 셸 접속 등 거의 모든 작업을 PC에서 원격으로 수행할 수 있다.

```
[PC] ←── USB 또는 Wi-Fi ──→ [안드로이드 기기]
  adb 클라이언트                 adbd 데몬 (기기 내부에서 실행)
       ↕
  adb 서버 (PC에서 백그라운드 실행, 포트 5037)
```

### ADB 구성 요소

| 구성 요소 | 위치 | 역할 |
|---|---|---|
| `adb.exe` (클라이언트) | PC | 사용자가 명령을 입력하는 프로그램 |
| `adb server` | PC (백그라운드) | 클라이언트와 기기 사이의 통신을 중개 (포트 5037) |
| `adbd` (데몬) | 안드로이드 기기 내부 | PC에서 오는 명령을 실제로 실행 |

### ADB 설치 및 설정

#### 1. PC에 ADB 설치

**Windows:**
developer.android.com/tools/releases/platform-tools 에서 다운로드 → 압축 해제 (예: `C:\platform-tools`)

**Linux:**
```bash
sudo apt install adb
```

**macOS:**
```bash
brew install android-platform-tools
```

#### 2. PATH 환경변수 등록 (Windows)

매번 폴더 경로를 치지 않고 어디서든 `adb` 명령을 쓰기 위한 설정.

```powershell
# 현재 세션에서만 (PowerShell 닫으면 초기화)
$env:PATH += ";C:\platform-tools"

# 영구 등록 (새 PowerShell 창부터 적용)
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\platform-tools", "User")
```

**등록 확인:**
```powershell
# PATH에 등록됐는지 확인
$env:PATH -split ";" | Select-String "platform-tools"

# adb 실행 확인
adb version
# 출력 예: Android Debug Bridge version 1.0.41
```

#### 3. 안드로이드에서 USB 디버깅 활성화

```
설정 → 휴대전화 정보 → 소프트웨어 정보 → "빌드 번호" 7번 연타
→ "개발자 모드가 활성화되었습니다" 메시지 확인
→ 설정 → 개발자 옵션 → "USB 디버깅" ON
```

#### 4. USB 연결 및 인증

```
폰을 USB 케이블로 PC에 연결
→ 폰 화면에 "USB 디버깅을 허용하시겠습니까?" 팝업
→ "이 컴퓨터에서 항상 허용" 체크 → 허용
```

```powershell
adb devices
# List of devices attached
# XXXXXXXXXX    device         ← 정상 연결
# XXXXXXXXXX    unauthorized   ← 폰에서 허용 팝업을 아직 안 누른 상태
# XXXXXXXXXX    offline        ← 연결 불안정, 케이블/드라이버 문제
# (아무것도 안 뜸)             ← USB 디버깅이 꺼져 있거나 드라이버 미설치
```

### ADB 핵심 명령어 사전

#### 연결/상태

| 명령어 | 설명 |
|---|---|
| `adb devices` | 연결된 기기 목록 |
| `adb devices -l` | 연결된 기기 상세 정보 (모델명, 전송 방식 등) |
| `adb kill-server` | ADB 서버 종료 (연결 문제 시 리셋용) |
| `adb start-server` | ADB 서버 시작 |
| `adb reconnect` | 기기 재연결 |
| `adb -s <시리얼> <명령>` | 여러 기기 연결 시 특정 기기 지정 |

#### 셸 접속

```powershell
# 기기 셸 진입 (일반 사용자)
adb shell

# 루팅된 기기에서 root 셸
adb shell
su

# 셸에 진입하지 않고 명령 하나만 실행
adb shell ls /sdcard/
adb shell pm list packages
adb shell getprop ro.build.version.release    # 안드로이드 버전 확인
```

#### 파일 전송

```powershell
# PC → 기기 (push)
adb push C:\파일경로\파일.txt /sdcard/Download/

# 기기 → PC (pull)
adb pull /sdcard/Download/파일.txt C:\저장경로\

# 예시: 스크린샷 가져오기
adb shell screencap /sdcard/screenshot.png
adb pull /sdcard/screenshot.png .
```

#### 앱 관리

```powershell
# 앱 설치
adb install 앱이름.apk

# 앱 업데이트 설치 (기존 데이터 유지)
adb install -r 앱이름.apk

# 앱 삭제
adb uninstall 패키지명

# 설치된 앱 목록
adb shell pm list packages

# 특정 키워드로 앱 검색
adb shell pm list packages | findstr samsung

# 앱 강제 종료
adb shell am force-stop 패키지명

# 앱 데이터 초기화
adb shell pm clear 패키지명

# 앱 비활성화 (삭제 안 하고 숨기기, 블로트웨어 제거에 유용)
adb shell pm disable-user --user 0 패키지명

# 비활성화한 앱 복원
adb shell pm enable 패키지명
```

#### 시스템 정보

```powershell
# 기기 모델
adb shell getprop ro.product.model

# 안드로이드 버전
adb shell getprop ro.build.version.release

# API 레벨
adb shell getprop ro.build.version.sdk

# 배터리 상태
adb shell dumpsys battery

# 화면 해상도
adb shell wm size

# 화면 DPI
adb shell wm density

# 네트워크 정보
adb shell ifconfig
adb shell ip addr show

# 실시간 시스템 로그 (디버깅 필수)
adb logcat

# 로그 필터 (에러만)
adb logcat *:E

# 로그를 파일로 저장
adb logcat > log.txt
```

#### 화면/입력 제어

```powershell
# 스크린샷 촬영 후 PC로 가져오기
adb shell screencap /sdcard/screen.png && adb pull /sdcard/screen.png .

# 화면 녹화 (최대 3분)
adb shell screenrecord /sdcard/video.mp4
# Ctrl+C로 중지 후
adb pull /sdcard/video.mp4 .

# 터치 시뮬레이션 (x=500, y=1000 좌표 터치)
adb shell input tap 500 1000

# 스와이프 (x1,y1 → x2,y2 를 300ms 동안)
adb shell input swipe 500 1500 500 500 300

# 텍스트 입력 (영문만, 한글 불가)
adb shell input text "hello"

# 키 이벤트
adb shell input keyevent 26     # 전원 버튼
adb shell input keyevent 3      # 홈 버튼
adb shell input keyevent 4      # 뒤로가기
adb shell input keyevent 187    # 최근 앱
adb shell input keyevent 82     # 메뉴
adb shell input keyevent 24     # 볼륨 업
adb shell input keyevent 25     # 볼륨 다운
adb shell input keyevent 164    # 음소거
```

#### 네트워크 (Wi-Fi ADB)

USB 없이 같은 Wi-Fi에서 무선으로 ADB 사용:

```powershell
# 1. USB로 연결한 상태에서 TCP 모드 전환
adb tcpip 5555

# 2. 기기의 IP 확인
adb shell ip route | findstr "src"
# 예: ... src 192.168.0.100

# 3. USB 케이블 분리 후 Wi-Fi로 연결
adb connect 192.168.0.100:5555

# 4. 확인
adb devices
# 192.168.0.100:5555    device

# 5. 다시 USB 모드로 돌아가기
adb usb
```

#### 백업/복원

```powershell
# 전체 백업 (앱 + 데이터)
adb backup -apk -shared -all -f backup.ab

# 복원
adb restore backup.ab
```

#### 부팅 모드 전환

```powershell
adb reboot              # 일반 재부팅
adb reboot bootloader   # 부트로더/Fastboot 모드
adb reboot recovery     # 리커버리 모드
adb reboot download     # 삼성 다운로드 모드 (Odin용)
```

#### Fastboot (부트로더 모드에서 사용)

```powershell
# 부트로더 잠금 해제 (OEM Unlock — 공장 초기화됨)
fastboot oem unlock

# 커스텀 리커버리 설치
fastboot flash recovery recovery.img

# 부트 이미지 플래시
fastboot flash boot boot.img

# 재부팅
fastboot reboot
```

### ADB가 활성화되지 않은 안드로이드 — 우회 방법

USB 디버깅이 꺼져 있고 화면 잠금도 걸린 상태에서의 접근법:

#### 방법 1: 리커버리 모드에서 ADB 활성화

일부 커스텀 리커버리(TWRP 등)는 ADB를 자체적으로 허용한다:
```
전원 끄기 → 전원 + 볼륨 상 동시 길게 누르기
→ 리커버리 모드 진입
→ TWRP가 설치된 경우: "Advanced" → "ADB Sideload" 또는 자동으로 ADB 활성화
```

TWRP 리커버리에서:
```powershell
adb devices          # TWRP 상태에서 기기가 잡히는지 확인
adb shell            # 셸 접속 가능 (root 권한)

# 잠금 해제 관련 파일 삭제
adb shell rm /data/system/gesture.key        # 패턴 잠금
adb shell rm /data/system/password.key       # 비밀번호 잠금
adb shell rm /data/system/locksettings.db    # 잠금 설정 DB
adb shell rm /data/system/locksettings.db-wal
adb shell rm /data/system/locksettings.db-shm
adb reboot
```

순정 리커버리(제조사 기본)에서는 ADB가 차단되어 있어 이 방법이 안 된다.

#### 방법 2: 삼성 — 다운로드 모드 + Odin

삼성 기기는 리커버리 대신 다운로드 모드(Odin 모드)를 통해 펌웨어를 직접 플래시할 수 있다:
```
전원 끄기 → 볼륨 하 + 전원 동시 길게 (USB 연결 상태)
→ 다운로드 모드 진입
→ PC에서 Odin 실행 → 펌웨어 또는 커스텀 리커버리(TWRP) 플래시
→ TWRP에서 잠금 파일 삭제
```

#### 방법 3: Fastboot (OEM Unlock이 미리 켜져 있는 경우)

```
전원 끄기 → 전원 + 볼륨 하 동시 길게
→ Fastboot/부트로더 모드 진입
```

```powershell
fastboot devices                # 기기 인식 확인
fastboot oem unlock             # 부트로더 잠금 해제 (데이터 전부 삭제됨!)
```

"OEM 잠금 해제"가 개발자 옵션에서 미리 켜져 있어야만 작동한다. 꺼져 있으면 이 방법은 불가능.

#### 방법 4: 구글 계정 인증 (Android 4.4 이하)

안드로이드 4.4(KitKat) 이하에서는 비밀번호를 5회 틀리면 "비밀번호를 잊으셨나요?" 옵션이 뜨고, 구글 계정으로 잠금 해제 가능. 안드로이드 5.0 이상에서는 이 기능이 삭제됨.

#### 현실적 정리

| 상황 | 가능한 방법 |
|---|---|
| USB 디버깅 ON + 화면 잠금 | ADB로 잠금 파일 삭제 |
| USB 디버깅 OFF + TWRP 설치됨 | 리커버리에서 ADB 사용 → 잠금 파일 삭제 |
| USB 디버깅 OFF + OEM Unlock ON | Fastboot으로 부트로더 해제 → 초기화 (데이터 삭제) |
| USB 디버깅 OFF + 삼성 | 다운로드 모드 → Odin으로 TWRP 플래시 → 잠금 삭제 |
| 전부 OFF + 순정 상태 | Google/삼성 원격 초기화, 또는 리커버리 모드 공장 초기화 (데이터 삭제) |

---

## 16. 스마트폰 잠금 해제 — 비공식 방법

> 아래 방법들은 **본인 소유 기기**에서만 사용해야 한다. 타인의 기기에 무단으로 적용하면 법적 문제가 발생한다.

### Android 비공식 잠금 해제

#### 1. ADB 잠금 파일 삭제 (USB 디버깅 ON 필수)

```powershell
adb shell
su
rm /data/system/gesture.key
rm /data/system/password.key
rm /data/system/locksettings.db
rm /data/system/locksettings.db-wal
rm /data/system/locksettings.db-shm
reboot
```
재부팅 후 잠금 화면이 뜨더라도 **아무 패턴/비밀번호나 입력**하면 풀린다.

#### 2. TWRP 리커버리 경유 (USB 디버깅 OFF여도 가능)

TWRP가 설치되어 있거나, Odin/Fastboot로 TWRP를 새로 설치할 수 있다면:
```
리커버리 모드 진입 → TWRP 파일 관리자
→ /data/system/ 이동
→ gesture.key, password.key, locksettings.db 삭제
→ 재부팅
```

또는 TWRP 터미널에서:
```bash
# TWRP → Advanced → Terminal
rm /data/system/gesture.key
rm /data/system/password.key
rm /data/system/locksettings.db*
reboot
```

#### 3. Magisk 모듈 — 자동 잠금 해제

Magisk가 설치된 루팅 기기에서, 미리 잠금 해제 모듈을 설치해두면 비상시 리커버리 경유로 잠금을 제거할 수 있다 (사전 준비 필요).

### iPhone 비공식 잠금 해제

iOS는 안드로이드보다 잠금 우회가 훨씬 어렵다. Apple의 보안 체인(Secure Enclave, 활성화 잠금)이 하드웨어 수준에서 보호하기 때문.

#### 1. checkm8 / checkra1n (하드웨어 취약점 이용)

**대상:** iPhone 5s ~ iPhone X (A7~A11 칩)

checkm8은 부트 ROM(하드웨어)의 취약점을 이용한 익스플로잇으로, Apple이 소프트웨어 업데이트로 패치할 수 없다 (하드웨어에 새겨진 코드라서).

```
PC에 checkra1n 설치 (Linux 또는 macOS)
→ iPhone을 DFU 모드로 진입:
  전원 + 홈(또는 볼륨 하) 길게 → 화면 꺼지면 전원만 떼고 홈(볼륨 하) 계속
→ checkra1n이 자동으로 탈옥 진행
→ 탈옥된 상태에서 SSH/파일 관리자로 잠금 관련 파일 접근 가능
```

제한 사항:
- iPhone XS/XR(A12) 이후 기기에서는 작동하지 않음
- 재부팅하면 탈옥이 풀림 (semi-tethered)
- 활성화 잠금(iCloud Lock)은 별도 문제 — checkm8으로 화면 잠금은 풀어도 Apple ID 잠금은 유지됨

#### 2. 상용 잠금 해제 도구

| 도구 | 대상 | 방식 | 비용 |
|---|---|---|---|
| Tenorshare 4uKey | iOS/Android | 복원 모드 강제 진입 → 초기화 후 잠금 제거 | 유료 ($30~50) |
| iMyFone LockWiper | iOS | DFU/복원 모드 → 잠금 제거 | 유료 ($30~50) |
| Dr.Fone Unlock | iOS/Android | 복원 모드 → 잠금 제거 | 유료 ($40~60) |

주의: 이 도구들 대부분은 내부적으로 **Apple의 복원(Restore) 프로세스를 자동화**한 것이다. 즉 데이터가 삭제된다. "데이터 유지하면서 잠금 해제"를 광고하는 도구가 있지만, iOS에서는 기술적으로 불가능에 가깝다.

#### 3. DFU 모드 복원 (수동)

상용 도구 없이 직접 하는 방법:

```
1. iPhone을 PC에 USB로 연결
2. DFU 모드 진입:
   - iPhone 8 이후:
     볼륨 상 짧게 → 볼륨 하 짧게
     → 전원 버튼 길게 (화면 꺼짐)
     → 전원 누른 채로 볼륨 하도 같이 5초
     → 전원만 떼고 볼륨 하 계속 (15초)
     → 화면은 완전히 검은데 iTunes가 "복구 모드 기기 감지" 표시하면 성공
   - iPhone 7: 전원 + 볼륨 하 동시 (위와 유사)
   - iPhone 6s 이전: 전원 + 홈 버튼 동시
3. iTunes/Finder에서 "복원" 선택
4. 최신 iOS가 다운로드되고 기기가 초기화됨
```

DFU 복원 후에도 **활성화 잠금(Activation Lock)**이 걸려있으면 기존 Apple ID/비밀번호를 입력해야 한다. 이걸 우회하는 것은 checkm8 대상 기기(A11 이하)에서만 일부 가능하다.

#### 4. 활성화 잠금(iCloud Lock) 우회

화면 잠금과 별개로, Apple ID에 연결된 활성화 잠금은 가장 어려운 보안 계층이다.

| 기기 | 우회 가능 여부 |
|---|---|
| A7~A11 (iPhone 5s ~ X) | checkm8 기반 도구로 제한적 우회 가능 (Wi-Fi만, 셀룰러 불가 등 기능 제한) |
| A12 이후 (XS, 11, 12, 13, 14, 15, 16) | 현재까지 알려진 우회 방법 없음 |

### iPhone vs Android 잠금 해제 비교

| 구분 | Android | iPhone |
|---|---|---|
| 데이터 살리면서 해제 | 가능 (ADB/TWRP로 잠금 파일만 삭제) | 거의 불가능 (복원 = 초기화) |
| 루팅/탈옥 없이 해제 | 삼성 Find My Mobile (데이터 유지) | 불가능 |
| 하드웨어 익스플로잇 | 거의 불필요 (소프트웨어로 대부분 가능) | A11 이하만 checkm8 |
| 활성화 잠금 우회 | FRP → 여러 우회법 존재 | A12 이후 사실상 불가능 |
| 전체적 난이도 | 상대적으로 쉬움 | 매우 어려움 |

### 사전 대비 권장 사항

잠겨버리기 전에 미리 해둘 것:
1. **ADB USB 디버깅 켜두기** (안드로이드)
2. **"OEM 잠금 해제" 활성화** (안드로이드 개발자 옵션)
3. **TWRP 커스텀 리커버리 설치** (안드로이드 루팅 기기)
4. **iCloud/Google 백업 활성화** (양쪽 다)
5. **삼성 계정 / Apple ID 비밀번호를 별도 기록** (비밀번호 관리자 등)

---

### 연습 문제 (추가)

**문제 16.** `adb shell pm disable-user --user 0 com.samsung.bloatware` 명령이 하는 일과, `adb uninstall`과의 차이를 설명하시오.

<details>
<summary>정답 보기</summary>

`pm disable-user --user 0`은 앱을 **비활성화**한다. 시스템에서 숨겨지고 실행되지 않지만, APK 파일은 기기에 남아있다. `pm enable 패키지명`으로 언제든 복원 가능. 시스템 앱(블로트웨어)은 `uninstall`로 삭제가 안 되는 경우가 많아서 이 방법을 쓴다.

`adb uninstall`은 앱을 **완전히 삭제**한다. 사용자가 설치한 앱은 삭제 가능하지만, `/system/app/`에 있는 시스템 앱은 root 권한 없이 삭제 불가.

</details>

---

**문제 17.** iPhone X(A11)와 iPhone 13(A15)에 화면 잠금이 걸렸다. 각각 데이터를 살릴 수 있는 방법이 있는지 설명하시오.

<details>
<summary>정답 보기</summary>

**iPhone X (A11):** checkm8 하드웨어 취약점 대상이므로 checkra1n으로 탈옥 → 파일 시스템 접근 가능 → 잠금 관련 파일 수정/삭제로 데이터를 살리면서 잠금 해제가 가능할 수 있다 (보장은 아님). 단, 재부팅하면 탈옥이 풀리고(semi-tethered), 활성화 잠금은 별도.

**iPhone 13 (A15):** checkm8이 작동하지 않음 (A12 이상). 현재 알려진 비공식 우회법이 없으며, DFU 복원(데이터 전부 삭제)이 유일한 방법. iCloud에 백업이 있다면 복원 후 백업에서 데이터 복구 가능.

결론: A11 이하는 데이터 살릴 가능성 있음, A12 이상은 사실상 불가능.

</details>

---

**문제 18.** ADB로 Wi-Fi 무선 디버깅을 설정하는 과정을 순서대로 설명하시오. 보안상 주의점은?

<details>
<summary>정답 보기</summary>

**순서:**
1. USB로 기기를 PC에 연결한 상태에서 `adb tcpip 5555` (TCP 모드 전환)
2. `adb shell ip route` 로 기기의 Wi-Fi IP 확인 (예: 192.168.0.100)
3. USB 케이블 분리
4. `adb connect 192.168.0.100:5555` 로 무선 연결
5. `adb devices`로 연결 확인

**보안 주의점:**
- ADB over TCP는 **인증/암호화가 없다.** 같은 Wi-Fi에 있는 누구든 `adb connect`로 내 기기에 접속할 수 있다.
- 공용 Wi-Fi(카페, 도서관)에서는 절대 사용 금지.
- 작업 끝나면 반드시 `adb usb`로 USB 모드로 복귀하거나 기기를 재부팅해서 TCP 모드를 끈다.
- Android 11 이상은 "무선 디버깅" 기능이 내장되어 페어링 코드 기반 인증을 제공하므로 더 안전.

</details>
