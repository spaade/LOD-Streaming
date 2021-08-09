import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "src/services/auth.service";

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {

  constructor(private appAuth: AuthService) {


  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {

      return (this.appAuth.user && this.appAuth.user.attributes.profile == 'lod-admin');
  }
}