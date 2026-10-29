import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSelect } from './user-select';

describe('UserSelect', () => {
  let component: UserSelect;
  let fixture: ComponentFixture<UserSelect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSelect],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSelect);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders every available user', () => {
    fixture.componentRef.setInput('users', [
      { id: 'alice', name: 'Alice' },
      { id: 'bob', name: 'Bob' }
    ]);
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>;

    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain('Alice');
    expect(options[1].textContent).toContain('Bob');
  });

  it('updates the selected user', () => {
    fixture.componentRef.setInput('users', [
      { id: 'alice', name: 'Alice' },
      { id: 'bob', name: 'Bob' }
    ]);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'bob';

    select.dispatchEvent(new Event('change'));

    expect(component.value()).toBe('bob');
  });

  it('disables the selector when requested', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;

    expect(select.disabled).toBe(true);
  });
});
