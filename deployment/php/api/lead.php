<?php
declare(strict_types=1);

// Deploy as /api/lead.php on a PHP 8.1+ server. NEVER commit MAX secrets.
// GitHub Pages only hosts static assets and cannot execute PHP.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, string $message, bool $success = false): never {
    http_response_code($status);
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
function input(string $key): string {
    $raw = $_POST[$key] ?? '';
    if (!is_string($raw) || !preg_match('//u', $raw)) {
        respond(400, 'Некорректные данные формы.');
    }
    return trim((string) preg_replace('/\s+/u', ' ', $raw));
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, 'Метод не поддерживается.');
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768) {
    respond(413, 'Слишком большой запрос.');
}
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $originHost = parse_url($origin, PHP_URL_HOST);
    $host = explode(':', (string) ($_SERVER['HTTP_HOST'] ?? ''))[0];
    if (!is_string($originHost) || $host === '' || strcasecmp($originHost, $host) !== 0) {
        respond(403, 'Недопустимый источник запроса.');
    }
}
if (input('website') !== '') {
    respond(200, 'Заявка принята.', true); // Honeypot
}
$name = input('name');
$phone = preg_replace('/\D+/', '', input('phone'));
$service = input('service');
$comment = input('message');
if (!preg_match('/^.{2,80}$/us', $name)) {
    respond(400, 'Укажите имя от 2 до 80 символов.');
}
if (strlen($phone) === 10 && $phone[0] === '9') $phone = '7' . $phone;
if (strlen($phone) === 11 && $phone[0] === '8') $phone = '7' . substr($phone, 1);
if (!preg_match('/^7\d{10}$/', $phone)) {
    respond(400, 'Укажите корректный номер телефона.');
}
$services = [
    'Вода в подвале', 'Инъекционная гидроизоляция', 'Ремонт трещин',
    'Усиление фундамента', 'Укрепление грунта / склона', 'Другая задача',
];
if (!in_array($service, $services, true) || !preg_match('/^.{0,1000}$/us', $comment) || input('consent') !== '1') {
    respond(400, 'Проверьте заполнение формы и согласие.');
}

// Per-IP rate limit: 5 requests per 15 minutes. Use REMOTE_ADDR, never untrusted XFF.
$file = sys_get_temp_dir() . '/aquaseif-rl-' . hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown')) . '.json';
$handle = @fopen($file, 'c+');
if ($handle === false || !flock($handle, LOCK_EX)) {
    respond(503, 'Временная ошибка. Пожалуйста, позвоните нам.');
}
$history = json_decode((string) stream_get_contents($handle), true);
$now = time();
$history = is_array($history) ? array_values(array_filter($history, fn($t) => is_int($t) && $t > $now - 900)) : [];
if (count($history) >= 5) {
    flock($handle, LOCK_UN);
    fclose($handle);
    header('Retry-After: 900');
    respond(429, 'Слишком много обращений. Повторите позже или позвоните.');
}
$history[] = $now;
rewind($handle);
ftruncate($handle, 0);
fwrite($handle, (string) json_encode($history));
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);

$token = getenv('MAX_BOT_TOKEN') ?: '';
$recipientType = getenv('MAX_RECIPIENT_TYPE') ?: 'user';
$recipientId = getenv('MAX_RECIPIENT_ID') ?: '';
if ($token === '' || !in_array($recipientType, ['user', 'chat'], true) || !preg_match('/^-?\d+$/', $recipientId) || !function_exists('curl_init')) {
    error_log('AquaSeif: MAX integration not configured');
    respond(503, 'Отправка пока недоступна. Пожалуйста, позвоните нам.');
}
$utm = [];
foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'] as $key) {
    $value = input($key);
    if ($value !== '') $utm[] = $key . ': ' . substr($value, 0, 200);
}
$lines = [
    '🔔 Новая заявка — АкваСейф',
    'Время: ' . (new DateTimeImmutable('now', new DateTimeZone('Europe/Moscow')))->format('d.m.Y H:i') . ' МСК',
    'Имя: ' . $name,
    'Телефон: +' . $phone,
    'Направление: ' . $service,
    'Комментарий: ' . ($comment !== '' ? $comment : 'Не указан'),
    'Источник: ' . ($utm ? implode(' | ', $utm) : 'Без UTM-меток'),
];
$url = 'https://platform-api2.max.ru/messages?' . http_build_query([
    $recipientType === 'chat' ? 'chat_id' : 'user_id' => $recipientId
]);
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Authorization: ' . $token, 'Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode(['text' => implode("\n", $lines)], JSON_UNESCAPED_UNICODE),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 12,
]);
$raw = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_errno($ch);
curl_close($ch);
$result = is_string($raw) ? json_decode($raw, true) : null;
if ($curlError || $status !== 200 || !is_array($result) || !isset($result['message'])) {
    error_log('AquaSeif MAX delivery error: http=' . $status . ', curl=' . $curlError);
    respond(502, 'Не удалось доставить заявку. Пожалуйста, позвоните нам.');
}
respond(200, 'Заявка отправлена. Мы свяжемся с вами.', true);
