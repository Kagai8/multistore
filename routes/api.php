<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MpesaController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/mpesa/callback', [MpesaController::class, 'callback']);
Route::get('/mpesa/status/{checkout_request_id}', [MpesaController::class, 'checkStatus']);
Route::post('/mpesa/verify', [MpesaController::class, 'verifyTransaction']);
