import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Observable, empty, throwError, Subject } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class WebRequestInterceptor implements HttpInterceptor {

    constructor(private authService: AuthService, private router: Router) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
        request = this.addAuthHeader(request);

        // call next() and handle the response
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                console.log(error);

                if (error.status === 401 && request.url.endsWith('/users/me/access-token')) {
                    // this means that we tried to refresh the access token but failed
                    // so therefore the refresh token has expired
                    console.log("Refresh Token has expired");

                    this.authService.removeStorageItems();

                    // redirect the user to /login
                    this.router.navigateByUrl("/login");
                    
                    return empty();
                }

                if (error.status === 401) {
                    // 401 error means we are unauthorized
                    // not /users/me/access-token therefore the Access Token has expired
                    // We have to try and refresh the Access Token.

                    return this.refreshAccessToken().pipe(
                        switchMap(() => {
                            request = this.addAuthHeader(request);
                            return next.handle(request);
                        }),
                        catchError((err: any) => {
                            console.log("Catching Error");
                            console.log(err);
                            this.authService.removeStorageItems();
                            this.router.navigateByUrl('/login');
                            return empty();
                        })
                    )

                }

                return throwError(error);
            })
        )
    }

    refreshAccessToken() {
        return this.authService.getNewAccessToken().pipe(
            tap(() => {
                console.log("Access Token Refreshed")
            })
        )
    }

    addAuthHeader(request: HttpRequest<any>) {
        // get the access token
        const token = this.authService.getAccessToken();

        if (token) {
            // append the access token to the request header
            return request.clone({
                setHeaders: {
                    'x-access-token': token
                }
            })
        }

        return request;
    }
}
