import { Injectable } from '@angular/core';
import { WebRequestService } from './web-request.service';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { shareReplay, tap } from 'rxjs/operators';
import { User } from './user.model';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private webReqService: WebRequestService, private http: HttpClient) { }

  login(email: string, password: string) {
    return this.http.post(`${this.webReqService.ROOT_URI}/users/login`, {
      email,
      password
    }, {
      observe: 'response'
    }).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        // the auth tokens will be in the header of this response
        console.log(res.headers);
        localStorage.setItem('accessToken', res.headers.get('x-access-token'));
        localStorage.setItem('refreshToken', res.headers.get('x-refresh-token'));
        localStorage.setItem('userId', res.body._id);
        console.log("Sucessfully logged in");
      })
    )
  }

  signup(name: string, email: string, password: string) {
    return this.http.post(`${this.webReqService.ROOT_URI}/users`, {
      name,
      email,
      password
    }, {
      observe: 'response'
    }).pipe(
      shareReplay(),
      tap((res: HttpResponse<any>) => {
        console.log("Signed up successfully")
      })
    )
  }


  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  getUserId() {
    return localStorage.getItem('userId');
  }

  removeStorageItems() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
  }

  getNewAccessToken() {
    const refreshToken = this.getRefreshToken();
    const userId = this.getUserId();

    if (refreshToken && userId) {
      return this.http.get(`${this.webReqService.ROOT_URI}/users/me/access-token`, {
        headers: {
          'x-refresh-token': refreshToken,
          '_id': userId
        }, 
        observe: 'response'
      }).pipe(
        tap((res: HttpResponse<any>) => {
          localStorage.setItem('accessToken', res.headers.get('x-access-token'))
        })
      )
    } else {
      return throwError(new Error('Refresh token and/or User Id is null or undefined'));
    }
  }
  
}
