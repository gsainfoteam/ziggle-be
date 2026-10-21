# Admin 권한

유저의 `isAdmin`으로 관리자 여부를 구분합니다. 기존 유저와 신규 유저의
기본값은 `false`이며, `GET /user/info` 응답에도 `isAdmin`이 포함됩니다.

## 권한 변경 API

서비스 이용에 동의한 admin의 Ziggle JWT로 요청합니다.

```http
PATCH /user/123e4567-e89b-12d3-a456-426614174000/admin
Authorization: Bearer <access_token>
Content-Type: application/json

{ "isAdmin": true }
```

`true`는 관리자 권한을 부여하고, `false`는 회수합니다. 성공하면 `200`과
변경된 유저 정보를 반환합니다. 같은 값으로 다시 요청해도 성공합니다.

- `400`: UUID가 유효하지 않거나 `isAdmin`이 boolean이 아닌 경우
- `401`: JWT가 없거나 유효하지 않은 경우
- `403`: 요청자가 서비스 이용에 동의하지 않았거나 admin이 아닌 경우
- `404`: 대상 유저가 없는 경우

JWT 인증 시마다 DB에서 유저를 조회하므로 권한 변경은 다음 요청부터
적용됩니다. 기존 JWT를 다시 발급받을 필요가 없습니다.

관리자 전용 API에는 `@UseGuards(JwtGuard, AdminGuard)`를 순서대로 적용합니다.
`AdminGuard`는 `AuthModule`에서 export합니다.

## 최초 admin 지정

배포 시 `npx prisma migrate deploy`로 마이그레이션을 적용합니다.
최초 admin은 DB 관리자가 기존 유저 UUID를 확인한 후 지정합니다.

```sql
UPDATE "user"
SET "is_admin" = true
WHERE "uuid" = '123e4567-e89b-12d3-a456-426614174000';
```

이후 API로 다른 유저에게 권한을 부여할 수 있습니다. API는 자신의 권한도
회수할 수 있으므로, 마지막 admin의 권한을 회수하면 DB에서 다시 지정해야 합니다.
